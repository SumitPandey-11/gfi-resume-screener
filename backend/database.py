
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Read DATABASE_URL from environment.
# Use SQLite locally if DATABASE_URL is not configured.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./resume_screener.db"
)

# Render may provide postgres://, while SQLAlchemy expects
# postgresql:// for the PostgreSQL dialect.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://", "postgresql://", 1
    )

# Configure database engine separately for SQLite and PostgreSQL.
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True
    )

# Database session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# SQLAlchemy model base
Base = declarative_base()
