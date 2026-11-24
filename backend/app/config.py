from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR.parent / '.env', env_file_encoding='utf-8', extra='ignore')

    # PostgreSQL in production, e.g. postgresql+psycopg://user:pass@db:5432/physicstech
    database_url: str = f"sqlite:///{(BACKEND_DIR / 'physicstech-dev.db').as_posix()}"
    # Token of the existing bot (BotFather). Used only on the server to verify Telegram initData.
    bot_token: str = ''
    # Telegram user ids (comma separated) that may open the statistics screen.
    admin_telegram_ids: str = ''
    # How long a Telegram initData stays valid, seconds.
    init_data_max_age: int = 86400
    # Local testing only: accept the "X-Dev-User: <id>:<name>" header instead of Telegram initData.
    dev_auth: bool = False
    # Extra origins allowed to call the API (only when the frontend is hosted elsewhere, e.g. GitHub Pages).
    cors_origins: str = ''
    frontend_dir: str = str(BACKEND_DIR.parent / 'frontend')
    max_sync_bytes: int = 3_000_000

    @property
    def admin_ids(self) -> set[int]:
        out = set()
        for part in self.admin_telegram_ids.replace(';', ',').split(','):
            part = part.strip()
            if part.lstrip('-').isdigit():
                out.add(int(part))
        return out

    @property
    def cors_list(self) -> list[str]:
        return [o.strip().rstrip('/') for o in self.cors_origins.split(',') if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
