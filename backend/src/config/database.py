"""
Database configuration and session management for SQLAlchemy ORM.

This module sets up the SQLAlchemy database connection with proper connection pooling,
creates the Base class for model inheritance, and provides a dependency injection
function for database session management in route handlers.
"""

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import NullPool

from src.config.settings import settings

# Create SQLAlchemy engine with connection pooling
# Using NullPool for development to avoid connection pooling issues
# In production, consider using QueuePool for better connection management
engine = create_engine(
    settings.DATABASE_URL,
    # Connection pooling configuration
    poolclass=NullPool,  # Disable connection pooling for SQLite compatibility in testing
    # Alternative for production: pool_size=10, max_overflow=20
)

# Create SessionLocal class for database session management
# This factory creates new database sessions for each request
SessionLocal = sessionmaker(
    autocommit=False,  # Require explicit commit for transactions
    autoflush=False,   # Require explicit flush for query consistency
    bind=engine,       # Bind to the created engine
)

# Create Base class for model inheritance
# All SQLAlchemy models must inherit from this Base class
# The metadata from Base is used to create and manage database tables
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency injection function for database session management.
    
    This function is used as a FastAPI dependency to provide database sessions
    to route handlers. It ensures proper session creation and cleanup.
    
    Usage:
        @app.get("/items")
        async def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    
    Yields:
        Session: A SQLAlchemy database session for use in route handlers
    
    Note:
        The session is automatically closed in the finally block to ensure
        proper resource cleanup, even if an error occurs during the request.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        # Rollback the transaction if an error occurs
        db.rollback()
        raise
    finally:
        # Always close the session to release database connection
        db.close()
