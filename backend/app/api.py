import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from . import services
from .config import Settings, get_settings
from .db import get_db, utcnow
from .models import User
from .deps import admin_user, current_user

router = APIRouter(prefix='/api')


@router.get('/health')
def health():
    return {'status': 'ok'}


def _me(user: User, settings: Settings, db: Session) -> dict:
    return {'telegram_id': user.telegram_id, 'first_name': user.first_name, 'last_name': user.last_name, 'username': user.username,
            'is_admin': user.telegram_id in settings.admin_ids, 'time': services.time_totals(db, user.id)}


@router.get('/me')
def me(user: User = Depends(current_user), settings: Settings = Depends(get_settings), db: Session = Depends(get_db)):
    return _me(user, settings, db)


class SyncIn(BaseModel):
    state: dict
    base_rev: int | None = Field(default=None, ge=0)


@router.post('/sync')
async def sync(request: Request, user: User = Depends(current_user), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    """Body: {"state": <progress object from localStorage>, "base_rev": <last server revision this device saw>}."""
    try:
        declared = int(request.headers.get('content-length') or 0)
    except ValueError:
        declared = 0
    if declared > settings.max_sync_bytes:
        raise HTTPException(413, 'Слишком большой объём данных прогресса')
    body = await request.body()
    if len(body) > settings.max_sync_bytes:
        raise HTTPException(413, 'Слишком большой объём данных прогресса')
    try:
        payload = SyncIn.model_validate_json(body)
    except ValueError as e:
        raise HTTPException(422, 'Неверный формат данных прогресса') from e
    return await run_in_threadpool(services.sync_progress, db, user, payload.state, payload.base_rev)


class ActivityIn(BaseModel):
    session: str = Field(min_length=6, max_length=64, pattern=r'^[A-Za-z0-9_-]+$')
    seconds: int = Field(ge=0, le=3600)
    platform: str = Field(default='', max_length=32)


@router.post('/activity')
def activity(data: ActivityIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    credited = services.record_activity(db, user, data.session, data.seconds, data.platform)
    return {'credited': credited, **services.time_totals(db, user.id)}


# ---------------- admin ----------------

@router.get('/admin/users')
def admin_users(q: str = Query(default='', max_length=64), _: User = Depends(admin_user), db: Session = Depends(get_db)):
    rows = services.users_overview(db, q)
    return {'users': rows, 'summary': {
        'users': len(rows),
        'active_today': sum(1 for r in rows if r['today_seconds'] > 0),
        'active_week': sum(1 for r in rows if r['week_seconds'] > 0),
        'total_seconds': sum(r['total_seconds'] for r in rows),
    }}


@router.get('/admin/users/{telegram_id}')
def admin_user_detail(telegram_id: int, _: User = Depends(admin_user), db: Session = Depends(get_db)):
    d = services.user_detail(db, telegram_id)
    if d is None:
        raise HTTPException(404, 'Пользователь не найден')
    return d


def _hm(sec: int) -> str:
    return f'{sec // 3600}:{sec % 3600 // 60:02d}'


@router.get('/admin/users.csv')
def admin_users_csv(_: User = Depends(admin_user), db: Session = Depends(get_db)):
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=';')
    w.writerow(['Telegram ID', 'Имя', 'Фамилия', 'Username', 'Первый вход (UTC)', 'Последний вход (UTC)', 'Время всего, ч:мм', 'За 7 дней, ч:мм',
                'Сегодня, ч:мм', 'Сеансов', 'Ответов', 'Верных', 'Точность, %', 'Попыток зачёта', 'Лучшая оценка (экзамен)'])
    for r in services.users_overview(db):
        w.writerow([r['telegram_id'], r['first_name'], r['last_name'], r['username'], (r['created_at'] or '')[:16].replace('T', ' '),
                    (r['last_seen_at'] or '')[:16].replace('T', ' '), _hm(r['total_seconds']), _hm(r['week_seconds']), _hm(r['today_seconds']),
                    r['sessions'], r['answers'], r['correct'], '' if r['accuracy'] is None else r['accuracy'], r['exams'], r['best_grade'] or ''])
    name = f"physicstech-users-{utcnow():%Y-%m-%d}.csv"
    return Response('﻿' + buf.getvalue(), media_type='text/csv; charset=utf-8', headers={'Content-Disposition': f'attachment; filename="{name}"'})
