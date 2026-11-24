from datetime import date, datetime

from sqlalchemy import JSON, BigInteger, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base, utcnow

JSONType = JSON().with_variant(JSONB(), 'postgresql')
ID = BigInteger().with_variant(Integer(), 'sqlite')  # SQLite autoincrement needs INTEGER


class User(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(ID, primary_key=True, autoincrement=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    first_name: Mapped[str] = mapped_column(String(128), default='')
    last_name: Mapped[str] = mapped_column(String(128), default='')
    username: Mapped[str] = mapped_column(String(64), default='')
    language_code: Mapped[str] = mapped_column(String(16), default='')
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class ProgressSnapshot(Base):
    """Full client progress object (the same structure the app keeps in localStorage)."""
    __tablename__ = 'progress_snapshots'
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    rev: Mapped[int] = mapped_column(Integer, default=0)
    data: Mapped[dict] = mapped_column(JSONType, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class AnswerEvent(Base):
    """Append-only copy of answers from the client log, kept even if the student resets progress."""
    __tablename__ = 'answer_events'
    __table_args__ = (UniqueConstraint('user_id', 'ts', 'kind', 'item_id', 'mode', name='uq_answer_event'),)
    id: Mapped[int] = mapped_column(ID, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    ts: Mapped[int] = mapped_column(BigInteger)  # client time, ms since epoch
    kind: Mapped[str] = mapped_column(String(4))  # q - theory question, g - numeric problem
    item_id: Mapped[str] = mapped_column(String(64))
    topic: Mapped[str] = mapped_column(String(32), default='')
    ok: Mapped[bool] = mapped_column(Boolean)
    category: Mapped[str] = mapped_column(String(8), default='')
    mode: Mapped[str] = mapped_column(String(16), default='')


class ExamAttempt(Base):
    __tablename__ = 'exam_attempts'
    __table_args__ = (UniqueConstraint('user_id', 'ts', name='uq_exam_attempt'),)
    id: Mapped[int] = mapped_column(ID, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    ts: Mapped[int] = mapped_column(BigInteger)
    mode: Mapped[str] = mapped_column(String(16), default='')
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    grade: Mapped[int | None] = mapped_column(Integer, nullable=True)
    self_score: Mapped[float] = mapped_column(Float, default=0)
    items_total: Mapped[int] = mapped_column(Integer, default=0)
    items_ok: Mapped[int] = mapped_column(Integer, default=0)
    pct: Mapped[int] = mapped_column(Integer, default=0)
    duration_ms: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    legacy: Mapped[bool] = mapped_column(Boolean, default=False)


class ActivitySession(Base):
    """One opening of the Mini App; active_seconds counts only time while the app is on screen."""
    __tablename__ = 'activity_sessions'
    __table_args__ = (UniqueConstraint('user_id', 'session_key', name='uq_activity_session'),)
    id: Mapped[int] = mapped_column(ID, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    session_key: Mapped[str] = mapped_column(String(64))
    platform: Mapped[str] = mapped_column(String(32), default='')
    started_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    active_seconds: Mapped[int] = mapped_column(Integer, default=0)


class ActivityDay(Base):
    __tablename__ = 'activity_days'
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    day: Mapped[date] = mapped_column(Date, primary_key=True)  # Moscow date
    seconds: Mapped[int] = mapped_column(Integer, default=0)
