from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings

# Configure SQLAlchemy engine with robust connection pooling
engine = create_engine(
    settings.DB_URL,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_pre_ping=True,      # Tests connection liveness before borrowing from pool
    pool_recycle=180         # Recycles connections every 3 minutes to avoid stale sockets
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
