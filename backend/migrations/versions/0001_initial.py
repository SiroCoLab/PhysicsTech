"""Initial schema: users, progress snapshots, answers, exam attempts, activity.

Revision ID: 0001
Revises:
Create Date: 2026-11-20
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None

ID = sa.BigInteger().with_variant(sa.Integer(), 'sqlite')
JSONT = sa.JSON().with_variant(postgresql.JSONB(), 'postgresql')


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', ID, primary_key=True, autoincrement=True),
        sa.Column('telegram_id', sa.BigInteger(), nullable=False),
        sa.Column('first_name', sa.String(128), nullable=False, server_default=''),
        sa.Column('last_name', sa.String(128), nullable=False, server_default=''),
        sa.Column('username', sa.String(64), nullable=False, server_default=''),
        sa.Column('language_code', sa.String(16), nullable=False, server_default=''),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('last_seen_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_users_telegram_id', 'users', ['telegram_id'], unique=True)

    op.create_table(
        'progress_snapshots',
        sa.Column('user_id', ID, sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('rev', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('data', JSONT, nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )

    op.create_table(
        'answer_events',
        sa.Column('id', ID, primary_key=True, autoincrement=True),
        sa.Column('user_id', ID, sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('ts', sa.BigInteger(), nullable=False),
        sa.Column('kind', sa.String(4), nullable=False),
        sa.Column('item_id', sa.String(64), nullable=False),
        sa.Column('topic', sa.String(32), nullable=False, server_default=''),
        sa.Column('ok', sa.Boolean(), nullable=False),
        sa.Column('category', sa.String(8), nullable=False, server_default=''),
        sa.Column('mode', sa.String(16), nullable=False, server_default=''),
        sa.UniqueConstraint('user_id', 'ts', 'kind', 'item_id', 'mode', name='uq_answer_event'),
    )
    op.create_index('ix_answer_events_user_id', 'answer_events', ['user_id'])

    op.create_table(
        'exam_attempts',
        sa.Column('id', ID, primary_key=True, autoincrement=True),
        sa.Column('user_id', ID, sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('ts', sa.BigInteger(), nullable=False),
        sa.Column('mode', sa.String(16), nullable=False, server_default=''),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('max_score', sa.Integer(), nullable=True),
        sa.Column('grade', sa.Integer(), nullable=True),
        sa.Column('self_score', sa.Float(), nullable=False, server_default='0'),
        sa.Column('items_total', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('items_ok', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('pct', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('duration_ms', sa.BigInteger(), nullable=True),
        sa.Column('legacy', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.UniqueConstraint('user_id', 'ts', name='uq_exam_attempt'),
    )
    op.create_index('ix_exam_attempts_user_id', 'exam_attempts', ['user_id'])

    op.create_table(
        'activity_sessions',
        sa.Column('id', ID, primary_key=True, autoincrement=True),
        sa.Column('user_id', ID, sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('session_key', sa.String(64), nullable=False),
        sa.Column('platform', sa.String(32), nullable=False, server_default=''),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('last_seen_at', sa.DateTime(), nullable=False),
        sa.Column('active_seconds', sa.Integer(), nullable=False, server_default='0'),
        sa.UniqueConstraint('user_id', 'session_key', name='uq_activity_session'),
    )
    op.create_index('ix_activity_sessions_user_id', 'activity_sessions', ['user_id'])

    op.create_table(
        'activity_days',
        sa.Column('user_id', ID, sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('day', sa.Date(), primary_key=True),
        sa.Column('seconds', sa.Integer(), nullable=False, server_default='0'),
    )


def downgrade() -> None:
    for t in ('activity_days', 'activity_sessions', 'exam_attempts', 'answer_events', 'progress_snapshots', 'users'):
        op.drop_table(t)
