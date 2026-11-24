import time

import pytest

from app.telegram_auth import InitDataError, verify_init_data
from conftest import BOT, H, init_data


def test_valid_init_data():
    u = verify_init_data(init_data(42, 'Анна'), BOT, 3600)
    assert u.id == 42 and u.first_name == 'Анна' and u.username == 'user42'


@pytest.mark.parametrize('mutate', [
    lambda s: s.replace('auth_date=', 'auth_date=1'),          # data changed after signing
    lambda s: s[:-4] + '0000',                                  # hash changed
    lambda s: s.replace('hash=', 'x='),                         # no hash
    lambda s: '',
])
def test_tampered_init_data_rejected(mutate):
    with pytest.raises(InitDataError):
        verify_init_data(mutate(init_data(42)), BOT, 3600)


def test_wrong_token_rejected():
    with pytest.raises(InitDataError):
        verify_init_data(init_data(42, token='other:token'), BOT, 3600)


def test_expired_rejected():
    with pytest.raises(InitDataError, match='устарел'):
        verify_init_data(init_data(42, auth_date=int(time.time()) - 7200), BOT, 3600)


def test_no_token_configured():
    with pytest.raises(InitDataError, match='BOT_TOKEN'):
        verify_init_data(init_data(42), '', 3600)


def test_api_requires_telegram(client):
    assert client.get('/api/me').status_code == 401
    r = client.get('/api/me', headers={'Authorization': 'tma garbage'})
    assert r.status_code == 401 and 'detail' in r.json()


def test_dev_header_ignored_when_disabled(client):
    assert client.get('/api/me', headers={'X-Dev-User': '5:Test'}).status_code == 401


def test_dev_header_works_only_when_enabled(app_env, monkeypatch):
    from fastapi.testclient import TestClient
    from app.config import get_settings
    from app.main import create_app
    monkeypatch.setenv('DEV_AUTH', 'true')
    get_settings.cache_clear()
    with TestClient(create_app()) as c:
        j = c.get('/api/me', headers={'X-Dev-User': '5:%D0%A2%D0%B5%D1%81%D1%82'}).json()
        assert j['telegram_id'] == 5 and j['first_name'] == 'Тест'


def test_me_creates_and_updates_user(client):
    r = client.get('/api/me', headers=H(7, 'Мария'))
    assert r.status_code == 200
    j = r.json()
    assert j['telegram_id'] == 7 and j['first_name'] == 'Мария' and j['is_admin'] is False
    assert j['time'] == {'today_seconds': 0, 'week_seconds': 0, 'total_seconds': 0}
    j2 = client.get('/api/me', headers=H(7, 'Маша')).json()
    assert j2['first_name'] == 'Маша'


def test_health(client):
    assert client.get('/api/health').json() == {'status': 'ok'}
