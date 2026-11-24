"""Business logic: progress sync, derived statistics, activity time."""
from datetime import datetime, timedelta

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from .db import msk_day, utcnow
from .merge import canon, merge_states
from .models import ActivityDay, ActivitySession, AnswerEvent, ExamAttempt, ProgressSnapshot, User

MAX_HEARTBEAT = 120  # seconds credited per heartbeat at most
FIRST_HEARTBEAT = 60  # cap for the first heartbeat of a session
CLOCK_SLACK = 15


# ---------------- sync ----------------

def sync_progress(db: Session, user: User, state: dict, base_rev: int | None) -> dict:
    """Stores the client progress. If another device changed it since base_rev, merges both copies."""
    snap = db.get(ProgressSnapshot, user.id, with_for_update=True)
    merged = False
    if snap is None:
        final = state
        snap = ProgressSnapshot(user_id=user.id, rev=0, data={})
        db.add(snap)
        changed = True
    elif base_rev is not None and base_rev == snap.rev:
        final = state
        changed = canon(final) != canon(snap.data)
    else:
        final = merge_states(snap.data, state)
        merged = canon(final) != canon(state)
        changed = canon(final) != canon(snap.data)
    if changed:
        snap.data = final
        snap.rev += 1
        snap.updated_at = utcnow()
    _derive(db, user.id, final)
    db.commit()
    return {'rev': snap.rev, 'merged': merged, 'state': final if merged else None}


def _s(v, n: int) -> str:
    return str(v if v is not None else '')[:n]


def _derive(db: Session, user_id: int, state: dict) -> None:
    log = [e for e in state.get('log') or [] if isinstance(e, dict) and isinstance(e.get('ts'), (int, float)) and e.get('k') in ('q', 'g')]
    if log:
        lo = min(int(e['ts']) for e in log)
        have = set(db.execute(select(AnswerEvent.ts, AnswerEvent.kind, AnswerEvent.item_id, AnswerEvent.mode)
                              .where(AnswerEvent.user_id == user_id, AnswerEvent.ts >= lo)).all())
        for e in log:
            key = (int(e['ts']), e['k'], _s(e.get('id'), 64), _s(e.get('m'), 16))
            if key in have:
                continue
            have.add(key)
            db.add(AnswerEvent(user_id=user_id, ts=key[0], kind=key[1], item_id=key[2], mode=key[3],
                               topic=_s(e.get('t'), 32), ok=bool(e.get('ok')), category=_s(e.get('c'), 8)))
    hist = [h for h in state.get('hist') or [] if isinstance(h, dict) and isinstance(h.get('ts'), (int, float))]
    if hist:
        rows = {r.ts: r for r in db.scalars(select(ExamAttempt).where(ExamAttempt.user_id == user_id, ExamAttempt.ts.in_([int(h['ts']) for h in hist])))}
        for h in hist:
            ts = int(h['ts'])
            r = rows.get(ts)
            if r is None:
                r = ExamAttempt(user_id=user_id, ts=ts)
                db.add(r)
                rows[ts] = r
            v2 = h.get('v') == 2
            num = lambda k: h.get(k) if isinstance(h.get(k), (int, float)) and not isinstance(h.get(k), bool) else None
            r.legacy = not v2
            r.mode = _s(h.get('mode') or ('exam' if not v2 else ''), 16)
            r.score, r.max_score = num('score'), num('max')
            r.grade = int(h['grade']) if isinstance(h.get('grade'), int) else None
            r.self_score = float(num('self') or 0)
            r.items_total, r.items_ok, r.pct = int(num('n') or 0), int(num('ok') or 0), int(num('pct') or 0)
            r.duration_ms = int(num('dur')) if num('dur') is not None else None


# ---------------- activity ----------------

def record_activity(db: Session, user: User, session_key: str, seconds: int, platform: str, now: datetime | None = None) -> int:
    now = now or utcnow()
    seconds = max(0, min(int(seconds), MAX_HEARTBEAT))
    s = db.scalar(select(ActivitySession).where(ActivitySession.user_id == user.id, ActivitySession.session_key == session_key))
    if s is None:
        s = ActivitySession(user_id=user.id, session_key=session_key, platform=platform[:32], started_at=now, last_seen_at=now, active_seconds=0)
        db.add(s)
        credit = min(seconds, FIRST_HEARTBEAT)
    else:
        elapsed = max(0.0, (now - s.last_seen_at).total_seconds())
        credit = int(min(seconds, elapsed + CLOCK_SLACK))
    s.active_seconds += credit
    s.last_seen_at = now
    if credit:
        day = msk_day(now)
        d = db.get(ActivityDay, (user.id, day))
        if d is None:
            db.add(ActivityDay(user_id=user.id, day=day, seconds=credit))
        else:
            d.seconds += credit
    db.commit()
    return credit


def time_totals(db: Session, user_id: int, now: datetime | None = None) -> dict:
    today = msk_day(now or utcnow())
    q = lambda since=None: db.scalar(select(func.coalesce(func.sum(ActivityDay.seconds), 0)).where(
        ActivityDay.user_id == user_id, *( [ActivityDay.day >= since] if since else [])))
    return {'today_seconds': int(q(today)), 'week_seconds': int(q(today - timedelta(days=6))), 'total_seconds': int(q())}


# ---------------- admin statistics ----------------

def _iso(dt):
    return (dt.isoformat() + 'Z') if dt else None


def users_overview(db: Session, search: str = '', now: datetime | None = None) -> list[dict]:
    now = now or utcnow()
    today = msk_day(now)
    week = today - timedelta(days=6)
    t_total = dict(db.execute(select(ActivityDay.user_id, func.sum(ActivityDay.seconds)).group_by(ActivityDay.user_id)).all())
    t_week = dict(db.execute(select(ActivityDay.user_id, func.sum(ActivityDay.seconds)).where(ActivityDay.day >= week).group_by(ActivityDay.user_id)).all())
    t_today = dict(db.execute(select(ActivityDay.user_id, func.sum(ActivityDay.seconds)).where(ActivityDay.day == today).group_by(ActivityDay.user_id)).all())
    sess = dict(db.execute(select(ActivitySession.user_id, func.count()).group_by(ActivitySession.user_id)).all())
    ans = {r[0]: (r[1], r[2] or 0) for r in db.execute(select(AnswerEvent.user_id, func.count(), func.sum(case((AnswerEvent.ok, 1), else_=0))).group_by(AnswerEvent.user_id)).all()}
    exams: dict[int, list] = {}
    for r in db.scalars(select(ExamAttempt).order_by(ExamAttempt.ts)):
        exams.setdefault(r.user_id, []).append(r)
    needle = search.strip().casefold()
    out = []
    for u in db.scalars(select(User).order_by(User.last_seen_at.desc())):
        # filtered in Python: SQLite lower() does not handle Cyrillic, and the user count is small
        if needle and needle not in f'{u.first_name} {u.last_name} {u.username} {u.telegram_id}'.casefold():
            continue
        n, ok = ans.get(u.id, (0, 0))
        ex = [e for e in exams.get(u.id, []) if not e.legacy]
        ex_exam = [e for e in ex if e.mode == 'exam' and e.grade]
        last = ex[-1] if ex else None
        out.append({
            'telegram_id': u.telegram_id, 'first_name': u.first_name, 'last_name': u.last_name, 'username': u.username,
            'created_at': _iso(u.created_at), 'last_seen_at': _iso(u.last_seen_at),
            'total_seconds': int(t_total.get(u.id) or 0), 'week_seconds': int(t_week.get(u.id) or 0), 'today_seconds': int(t_today.get(u.id) or 0),
            'sessions': int(sess.get(u.id) or 0), 'answers': int(n), 'correct': int(ok), 'accuracy': round(100 * ok / n) if n else None,
            'exams': len(ex), 'best_grade': max((e.grade for e in ex_exam), default=None),
            'last_exam': {'ts': last.ts, 'score': last.score, 'max': last.max_score, 'grade': last.grade, 'mode': last.mode} if last else None,
        })
    return out


def user_detail(db: Session, telegram_id: int, now: datetime | None = None) -> dict | None:
    u = db.scalar(select(User).where(User.telegram_id == telegram_id))
    if u is None:
        return None
    now = now or utcnow()
    today = msk_day(now)
    since = today - timedelta(days=29)
    days = {d: s for d, s in db.execute(select(ActivityDay.day, ActivityDay.seconds).where(ActivityDay.user_id == u.id, ActivityDay.day >= since)).all()}
    daily = [{'day': (since + timedelta(days=i)).isoformat(), 'seconds': int(days.get(since + timedelta(days=i), 0))} for i in range(30)]
    topics = {}
    for t, ok, n in db.execute(select(AnswerEvent.topic, AnswerEvent.ok, func.count()).where(AnswerEvent.user_id == u.id).group_by(AnswerEvent.topic, AnswerEvent.ok)).all():
        e = topics.setdefault(t or '—', {'topic': t or '—', 'answers': 0, 'correct': 0})
        e['answers'] += n
        if ok:
            e['correct'] += n
    exams = [{'ts': r.ts, 'mode': r.mode, 'score': r.score, 'max': r.max_score, 'grade': r.grade, 'self': r.self_score,
              'items_total': r.items_total, 'items_ok': r.items_ok, 'pct': r.pct, 'duration_ms': r.duration_ms, 'legacy': r.legacy}
             for r in db.scalars(select(ExamAttempt).where(ExamAttempt.user_id == u.id).order_by(ExamAttempt.ts.desc()).limit(50))]
    sessions = [{'started_at': _iso(s.started_at), 'last_seen_at': _iso(s.last_seen_at), 'active_seconds': s.active_seconds, 'platform': s.platform}
                for s in db.scalars(select(ActivitySession).where(ActivitySession.user_id == u.id).order_by(ActivitySession.started_at.desc()).limit(20))]
    base = next((x for x in users_overview(db, now=now) if x['telegram_id'] == telegram_id), {})
    return {**base, 'daily': daily, 'topics': sorted(topics.values(), key=lambda x: -x['answers']), 'exam_list': exams, 'recent_sessions': sessions}
