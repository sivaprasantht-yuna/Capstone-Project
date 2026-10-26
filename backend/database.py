from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings

# Configure SQLAlchemy engine with lean connection pooling for low-memory container
engine = create_engine(
    settings.DB_URL,
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
