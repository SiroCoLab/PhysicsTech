"""Verification of Telegram Mini App initData (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app)."""
import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from urllib.parse import parse_qsl


class InitDataError(ValueError):
    pass


@dataclass(frozen=True)
class TgUser:
    id: int
    first_name: str = ''
    last_name: str = ''
    username: str = ''
    language_code: str = ''


def verify_init_data(init_data: str, bot_token: str, max_age: int, now: float | None = None) -> TgUser:
    if not bot_token:
        raise InitDataError('Сервер не настроен: не задан BOT_TOKEN')
    if not init_data or len(init_data) > 8192:
        raise InitDataError('Нет данных авторизации Telegram')
    try:
        pairs = parse_qsl(init_data, keep_blank_values=True, strict_parsing=True)
    except ValueError as e:
        raise InitDataError('Повреждённые данные авторизации') from e
    data = dict(pairs)
    if len(data) != len(pairs):
        raise InitDataError('Повреждённые данные авторизации')
    received = data.pop('hash', '')
    if not received:
        raise InitDataError('Нет подписи данных Telegram')
    check = '\n'.join(f'{k}={v}' for k, v in sorted(data.items()))
    secret = hmac.new(b'WebAppData', bot_token.encode(), hashlib.sha256).digest()
    expected = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, received.lower()):
        raise InitDataError('Подпись данных Telegram не прошла проверку')
    try:
        auth_date = int(data.get('auth_date', '0'))
    except ValueError as e:
        raise InitDataError('Повреждённые данные авторизации') from e
    now = time.time() if now is None else now
    if auth_date <= 0 or now - auth_date > max_age:
        raise InitDataError('Сеанс Telegram устарел: перезапустите приложение')
    try:
        u = json.loads(data.get('user', ''))
        uid = int(u['id'])
    except (ValueError, KeyError, TypeError) as e:
        raise InitDataError('В данных Telegram нет пользователя') from e
    s = lambda k, n: str(u.get(k) or '')[:n]
    return TgUser(id=uid, first_name=s('first_name', 128), last_name=s('last_name', 128), username=s('username', 64), language_code=s('language_code', 16))


def sign_init_data(fields: dict, bot_token: str) -> str:
    """Builds a correctly signed initData string (used by tests and local tools)."""
    from urllib.parse import urlencode
    check = '\n'.join(f'{k}={v}' for k, v in sorted(fields.items()))
    secret = hmac.new(b'WebAppData', bot_token.encode(), hashlib.sha256).digest()
    h = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    return urlencode({**fields, 'hash': h})
