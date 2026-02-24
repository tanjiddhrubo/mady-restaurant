"""
Infrastructure — SQLModel engine and session factory.
Change DATABASE_URL in .env to point to Supabase/Postgres for production.
"""
from sqlmodel import Session, SQLModel, create_engine

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


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
