from datetime import timedelta

from sqlalchemy import func, select

from app import services
from app.db import utcnow
from app.models import ActivityDay, AnswerEvent, ExamAttempt, User
from conftest import ADMIN, H


def ST(log=(), **kw):
    base = {'log': list(log), 'err': [], 'best': None, 'hist': [], 'read': {}, 'sv': [], 'used': {}, 'v': 1}
    base.update(kw)
    return base


def L(ts, ok=1, id_=1, k='q', m='quiz', t='kin'):
    return {'k': k, 'id': id_, 't': t, 'ok': ok, 'c': '' if ok else 'f', 'm': m, 'ts': ts}


def test_first_sync_stores_and_returns_rev(client):
    r = client.post('/api/sync', json={'state': ST([L(1)])}, headers=H(1))
    assert r.status_code == 200
    assert r.json() == {'rev': 1, 'merged': False, 'state': None}


def test_same_device_overwrites_without_merge(client):
    client.post('/api/sync', json={'state': ST([L(1)], read={'kin': True})}, headers=H(1))
    # the same device un-marks a topic: authoritative because base_rev matches
    r = client.post('/api/sync', json={'state': ST([L(1)], read={'kin': False}), 'base_rev': 1}, headers=H(1)).json()
    assert r == {'rev': 2, 'merged': False, 'state': None}
    r = client.post('/api/sync', json={'state': ST([L(1)], read={'kin': False}), 'base_rev': 2}, headers=H(1)).json()
    assert r['rev'] == 2  # nothing changed, revision stays


def test_second_device_gets_merged_progress(client):
    client.post('/api/sync', json={'state': ST([L(1), L(2, ok=0, id_=5)], err=[{'key': 'q:5', 'ts': 2}])}, headers=H(1))
    r = client.post('/api/sync', json={'state': ST([L(3, id_=9)]), 'base_rev': None}, headers=H(1)).json()
    assert r['merged'] is True and r['rev'] == 2
    assert [e['ts'] for e in r['state']['log']] == [1, 2, 3]
    assert r['state']['err'] == [{'key': 'q:5', 'ts': 2}]


def test_users_are_isolated(client):
    client.post('/api/sync', json={'state': ST([L(1)])}, headers=H(1))
    r = client.post('/api/sync', json={'state': ST([])}, headers=H(2)).json()
    assert r['rev'] == 1 and r['merged'] is False


def test_derived_answers_and_exams(client, db):
    hist = [{'ts': 100, 'n': 10, 'ok': 8, 'pct': 85, 'score': 11, 'max': 13, 'grade': 4, 'mode': 'exam', 'dur': 60000, 'self': 0, 'v': 2},
            {'ts': 50, 'n': 10, 'ok': 5, 'pct': 50}]
    st = ST([L(1), L(2, ok=0), L(3, k='g', id_='atw', t='dyn')], hist=hist)
    client.post('/api/sync', json={'state': st}, headers=H(1))
    client.post('/api/sync', json={'state': st, 'base_rev': 1}, headers=H(1))  # resent: no duplicates
    uid = db.scalar(select(User.id).where(User.telegram_id == 1))
    assert db.scalar(select(func.count()).select_from(AnswerEvent).where(AnswerEvent.user_id == uid)) == 3
    ex = {e.ts: e for e in db.scalars(select(ExamAttempt).where(ExamAttempt.user_id == uid))}
    assert ex[100].grade == 4 and ex[100].score == 11 and not ex[100].legacy
    assert ex[50].legacy and ex[50].grade is None
    hist[0]['self'] = 1
    client.post('/api/sync', json={'state': st, 'base_rev': 1}, headers=H(1))
    db.expire_all()
    assert db.scalar(select(ExamAttempt.self_score).where(ExamAttempt.ts == 100)) == 1


def test_reset_keeps_admin_history(client, db):
    client.post('/api/sync', json={'state': ST([L(1), L(2)])}, headers=H(1))
    r = client.post('/api/sync', json={'state': ST([], resetAt=10), 'base_rev': 1}, headers=H(1)).json()
    assert r['merged'] is False
    assert db.scalar(select(func.count()).select_from(AnswerEvent)) == 2


def test_sync_validation_and_size_limit(client, monkeypatch):
    assert client.post('/api/sync', json={'state': 'x'}, headers=H(1)).status_code == 422
    assert client.post('/api/sync', content=b'{bad', headers={**H(1), 'Content-Type': 'application/json'}).status_code == 422
    big = {'state': ST([L(i) for i in range(1)], pad='x' * 3_100_000)}
    assert client.post('/api/sync', json=big, headers=H(1)).status_code == 413


def test_activity_credit_rules(client, db):
    client.get('/api/me', headers=H(1))
    user = db.scalar(select(User).where(User.telegram_id == 1))
    t0 = utcnow()
    assert services.record_activity(db, user, 'sess-abc', 500, 'ios', now=t0) == 60          # first heartbeat capped
    assert services.record_activity(db, user, 'sess-abc', 30, 'ios', now=t0 + timedelta(seconds=30)) == 30
    assert services.record_activity(db, user, 'sess-abc', 100, 'ios', now=t0 + timedelta(seconds=40)) == 25  # elapsed 10 + slack 15
    assert services.record_activity(db, user, 'sess-abc', 1000, 'ios', now=t0 + timedelta(hours=1)) == 120  # per-call cap
    assert db.scalar(select(func.sum(ActivityDay.seconds))) == 235


def test_activity_endpoint(client):
    r = client.post('/api/activity', json={'session': 'abcdef12', 'seconds': 30, 'platform': 'android'}, headers=H(3))
    assert r.status_code == 200 and r.json()['credited'] == 30 and r.json()['total_seconds'] == 30
    assert client.post('/api/activity', json={'session': 'bad id!', 'seconds': 30}, headers=H(3)).status_code == 422
    assert client.post('/api/activity', json={'session': 'abcdef12', 'seconds': -1}, headers=H(3)).status_code == 422
    assert client.get('/api/me', headers=H(3)).json()['time']['today_seconds'] == 30


def test_admin_access_rules(client):
    assert client.get('/api/admin/users', headers=H(1)).status_code == 403
    assert client.get('/api/admin/users.csv', headers=H(1)).status_code == 403
    assert client.get('/api/admin/users/1', headers=H(1)).status_code == 403
    assert client.get('/api/admin/users').status_code == 401
    me = client.get('/api/me', headers=H(ADMIN, 'Админ')).json()
    assert me['is_admin'] is True


def test_admin_statistics(client):
    hist = [{'ts': 100, 'n': 10, 'ok': 9, 'pct': 92, 'score': 12, 'max': 13, 'grade': 5, 'mode': 'exam', 'dur': 1, 'self': 0, 'v': 2}]
    client.post('/api/sync', json={'state': ST([L(1), L(2, ok=0), L(3)], hist=hist)}, headers=H(1, 'Иван'))
    client.post('/api/activity', json={'session': 'abcdef12', 'seconds': 45}, headers=H(1, 'Иван'))
    client.get('/api/me', headers=H(2, 'Пётр'))
    j = client.get('/api/admin/users', headers=H(ADMIN)).json()
    rows = {r['telegram_id']: r for r in j['users']}
    iv = rows[1]
    assert iv['answers'] == 3 and iv['correct'] == 2 and iv['accuracy'] == 67
    assert iv['total_seconds'] == 45 and iv['today_seconds'] == 45 and iv['sessions'] == 1
    assert iv['exams'] == 1 and iv['best_grade'] == 5 and iv['last_exam']['score'] == 12
    assert rows[2]['answers'] == 0 and rows[2]['accuracy'] is None
    assert j['summary']['users'] == 3 and j['summary']['active_today'] == 1
    found = client.get('/api/admin/users', params={'q': 'пётр'}, headers=H(ADMIN)).json()['users']
    assert [r['telegram_id'] for r in found] == [2]
    d = client.get('/api/admin/users/1', headers=H(ADMIN)).json()
    assert len(d['daily']) == 30 and d['daily'][-1]['seconds'] == 45
    assert d['topics'] == [{'topic': 'kin', 'answers': 3, 'correct': 2}]
    assert d['exam_list'][0]['grade'] == 5 and d['recent_sessions'][0]['active_seconds'] == 45
    assert client.get('/api/admin/users/123456', headers=H(ADMIN)).status_code == 404
    csv = client.get('/api/admin/users.csv', headers=H(ADMIN))
    assert csv.status_code == 200 and csv.text.startswith('﻿Telegram ID;Имя') and 'Иван' in csv.text


def test_migrations_downgrade_and_upgrade(app_env):
    from alembic import command
    from alembic.config import Config
    from conftest import BACKEND
    cfg = Config(str(BACKEND / 'alembic.ini'))
    command.downgrade(cfg, 'base')
    command.upgrade(cfg, 'head')
