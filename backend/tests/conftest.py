import json
import sys
import time
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from app import db as dbm  # noqa: E402
from app.config import get_settings  # noqa: E402
from app.telegram_auth import sign_init_data  # noqa: E402

BOT = '123456789:TEST_token_for_unit_tests'
ADMIN = 999


def init_data(uid: int, name: str = 'Иван', auth_date: int | None = None, token: str = BOT) -> str:
    user = json.dumps({'id': uid, 'first_name': name, 'last_name': 'Петров', 'username': f'user{uid}', 'language_code': 'ru'}, ensure_ascii=False, separators=(',', ':'))
    return sign_init_data({'query_id': 'AAH', 'user': user, 'auth_date': str(auth_date or int(time.time()))}, token)


def H(uid: int, name: str = 'Иван') -> dict:
    return {'Authorization': 'tma ' + init_data(uid, name)}


@pytest.fixture
def app_env(tmp_path, monkeypatch):
    monkeypatch.setenv('DATABASE_URL', f"sqlite:///{(tmp_path / 'test.db').as_posix()}")
    monkeypatch.setenv('BOT_TOKEN', BOT)
    monkeypatch.setenv('ADMIN_TELEGRAM_IDS', str(ADMIN))
    monkeypatch.setenv('DEV_AUTH', 'false')
    monkeypatch.setenv('FRONTEND_DIR', str(tmp_path / 'no-frontend'))
    get_settings.cache_clear()
    dbm._engine = None
    command.upgrade(Config(str(BACKEND / 'alembic.ini')), 'head')
    yield
    if dbm._engine is not None:
        dbm._engine.dispose()
    dbm._engine = None
    get_settings.cache_clear()


@pytest.fixture
def client(app_env):
    from app.main import create_app
    with TestClient(create_app()) as c:
        yield c


@pytest.fixture
def db(app_env):
    gen = dbm.get_db()
    s = next(gen)
    yield s
    gen.close()
