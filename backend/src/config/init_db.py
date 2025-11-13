"""
Database initialization script for creating tables and schema.

This module provides functionality to initialize the database schema
by creating all tables defined in SQLAlchemy models. It should be run
once when setting up the application or when database models are updated.
"""

import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(backend_dir))

import logging
from sqlalchemy.exc import SQLAlchemyError

from src.config.database import Base, engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import all models to ensure they are registered with Base
# This must be done at module level before calling create_all
try:
    from src.models.user import User
    from src.models.question import Question
    from src.models.exam import Exam
    from src.models.exam_question import ExamQuestion
    from src.models.student_exam import StudentExam
    from src.models.student_answer import StudentAnswer
    logger.info("All models imported successfully")
except ImportError as e:
    # Models may not be defined yet, which is okay during initial setup
    logger.warning(f"Could not import all models: {str(e)}")
    pass


def init_db() -> None:
    """
    Initialize the database by creating all tables.
    
    This function creates all tables defined in SQLAlchemy models that inherit
    from the Base class. It reads the metadata from Base and creates the
    corresponding database tables.
    
    When to use:
        - On first application startup to set up the database schema
        - After adding new models to automatically create their tables
        - During testing to set up a clean database schema
    
    How to use:
        from src.config.init_db import init_db
        init_db()  # Run once on startup or in a management command
    
    Raises:
        SQLAlchemyError: If there's an error creating tables in the database
    
    Note:
        This function uses Base.metadata.create_all() which:
        - Only creates tables that don't already exist
        - Is safe to run multiple times
        - Does not alter existing tables
    """
    try:
        logger.info("Starting database initialization...")
        
        # Check how many tables are registered
        table_count = len(Base.metadata.tables)
        logger.info(f"Found {table_count} table(s) to create")
        
        if table_count == 0:
            logger.warning("No models found! Tables will be created when models are defined in Phase 3.")
        
        # Create all tables defined in models
        Base.metadata.create_all(bind=engine)
        
        logger.info("Database initialization completed successfully")
        
        if table_count > 0:
            logger.info(f"Created tables: {', '.join(Base.metadata.tables.keys())}")
    except SQLAlchemyError as e:
        logger.error(f"Error during database initialization: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during database initialization: {str(e)}")
        raise


if __name__ == "__main__":
    # Allow running this script directly for manual database initialization
    init_db()
