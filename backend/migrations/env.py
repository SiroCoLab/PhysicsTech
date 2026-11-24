from alembic import context

from app import models  # noqa: F401  (registers tables)
from app.config import get_settings
from app.db import Base, make_engine

target_metadata = Base.metadata


def run_offline():
    context.configure(url=get_settings().database_url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_online():
    connectable = context.config.attributes.get('connection')
    if connectable is not None:  # connection passed in by tests
        context.configure(connection=connectable, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
        return
    engine = make_engine(get_settings().database_url)
    with engine.connect() as conn:
        context.configure(connection=conn, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_offline()
else:
    run_online()
