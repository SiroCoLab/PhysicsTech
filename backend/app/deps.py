from urllib.parse import unquote

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import Settings, get_settings
from .db import get_db, utcnow
from .models import User
from .telegram_auth import InitDataError, TgUser, verify_init_data


def _dev_user(value: str) -> TgUser:
    uid, _, name = value.partition(':')
    name = unquote(name)
    if not uid.strip().lstrip('-').isdigit():
        raise HTTPException(401, 'Неверный X-Dev-User')
    return TgUser(id=int(uid), first_name=name.strip()[:128] or 'Тестовый пользователь')


def current_tg_user(authorization: str | None = Header(default=None), x_dev_user: str | None = Header(default=None),
                    settings: Settings = Depends(get_settings)) -> TgUser:
    if settings.dev_auth and x_dev_user:
        return _dev_user(x_dev_user)
    if not authorization or not authorization.lower().startswith('tma '):
        raise HTTPException(401, 'Откройте приложение из Telegram')
    try:
        return verify_init_data(authorization[4:].strip(), settings.bot_token, settings.init_data_max_age)
    except InitDataError as e:
        raise HTTPException(401, str(e)) from e


def current_user(tg: TgUser = Depends(current_tg_user), db: Session = Depends(get_db)) -> User:
    user = db.scalar(select(User).where(User.telegram_id == tg.id))
    now = utcnow()
    if user is None:
        user = User(telegram_id=tg.id, created_at=now)
        db.add(user)
    user.first_name, user.last_name, user.username, user.language_code = tg.first_name, tg.last_name, tg.username, tg.language_code
    user.last_seen_at = now
    db.commit()
    return user


def admin_user(user: User = Depends(current_user), settings: Settings = Depends(get_settings)) -> User:
    if user.telegram_id not in settings.admin_ids:
        raise HTTPException(403, 'Раздел доступен только администратору')
    return user
