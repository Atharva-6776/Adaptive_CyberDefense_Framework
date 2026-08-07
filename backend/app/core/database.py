import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

logger = logging.getLogger("app")

db_url = settings.DATABASE_URL
connect_args = {}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Attempt to check if configured database is reachable (especially if postgres)
try:
    if db_url.startswith("postgresql"):
        # Create a test engine with short timeout to verify connection
        # psycopg2 connection timeouts can be set via connect_args
        temp_engine = create_engine(
            db_url, 
            connect_args={"connect_timeout": 3},
            pool_pre_ping=True
        )
        with temp_engine.connect() as conn:
            pass
        engine = temp_engine
        logger.info("Successfully connected to PostgreSQL database.")
    else:
        engine = create_engine(db_url, connect_args=connect_args)
except Exception as e:
    logger.warning(
        f"Database connection to '{db_url}' failed: {str(e)}. "
        "Falling back to local SQLite database (sqlite:///./app.db) for developer experience."
    )
    db_url = "sqlite:///./app.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(db_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
