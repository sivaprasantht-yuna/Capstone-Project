from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings

# Normalize database URL:
# 1. Heroku / Render legacy "postgres://" -> "postgresql://"
# 2. If SQLAlchemy 2.1 defaults to psycopg or if psycopg2 is preferred, ensure driver is explicit
db_url = settings.DB_URL or ""
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    # Explicitly specify psycopg2 driver so SQLAlchemy never fails with missing default driver
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

# Configure SQLAlchemy engine with lean connection pooling for low-memory container
engine = create_engine(
    db_url,
    pool_size=3,
    max_overflow=5,
    pool_timeout=20,
    pool_pre_ping=True,      # Tests connection liveness before borrowing from pool
    pool_recycle=900         # Recycles idle connections every 15 minutes to avoid stale sockets
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
