from collections.abc import Iterator
from datetime import UTC, datetime, timedelta

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings

MSK = timedelta(hours=3)  # Europe/Moscow has no DST since 2014


def utcnow() -> datetime:
    """Naive UTC timestamp (stored the same way in SQLite and PostgreSQL)."""
    return datetime.now(UTC).replace(tzinfo=None)


def msk_day(dt: datetime):
    return (dt + MSK).date()


class Base(DeclarativeBase):
    pass


_engine = None
_factory = None


def make_engine(url: str):
    kw = {'pool_pre_ping': True}
    if url.startswith('sqlite'):
        kw['connect_args'] = {'check_same_thread': False}
    eng = create_engine(url, **kw)
    if url.startswith('sqlite'):
        @event.listens_for(eng, 'connect')
        def _fk(dbapi_conn, _):
            dbapi_conn.execute('PRAGMA foreign_keys=ON')
    return eng


def get_engine():
    global _engine, _factory
    if _engine is None:
        _engine = make_engine(get_settings().database_url)
        _factory = sessionmaker(bind=_engine, expire_on_commit=False)
    return _engine


def set_engine(engine) -> None:
    """Used by tests."""
    global _engine, _factory
    _engine = engine
    _factory = sessionmaker(bind=engine, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    get_engine()
    db = _factory()
    try:
        yield db
    finally:
        db.close()
