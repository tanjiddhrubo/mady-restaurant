"""
Infrastructure — SQLModel engine and session factory.
Change DATABASE_URL in .env to point to Supabase/Postgres for production.
"""
from sqlmodel import Session, SQLModel, create_engine, text

from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.get_db_url(),
    connect_args=connect_args,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=300,
)


# Columns to auto-add if missing (table, column, sql_type_default)
_MIGRATIONS = [
    ("menuitem", "foodpanda_url", "TEXT NOT NULL DEFAULT ''"),
]


def _run_migrations() -> None:
    """Add missing columns to existing tables (SQLite-safe ALTER TABLE)."""
    if not settings.DATABASE_URL.startswith("sqlite"):
        return  # Postgres/Supabase handles schema via create_all
    try:
        with engine.connect() as conn:
            for table, col, typedef in _MIGRATIONS:
                rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
                existing = {r[1] for r in rows}
                if col not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {typedef}"))
                    conn.commit()
    except Exception as e:
        print(f"Migration warning: {e}")


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)
    _run_migrations()


def get_session():
    with Session(engine) as session:
        yield session
