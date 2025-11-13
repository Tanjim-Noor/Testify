"""
Main FastAPI application entry point for the Online Exam Management System backend.

This module initializes the FastAPI application with CORS middleware,
startup event handlers, and core health check endpoint.
"""

import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from src.config.settings import settings
from src.config.database import get_db
from src.routes import auth

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_TITLE,
    description="Backend API for managing online exams, question banks, and student assessments",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include authentication router
app.include_router(auth.router)


@app.on_event("startup")
async def startup_event():
    """
    Event handler that runs when the application starts.
    Logs startup message and can be used for initialization tasks.
    """
    logger.info("Application started successfully")


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint to verify the application is running.
    
    Returns:
        dict: Status information indicating the application is healthy
    """
    return {"status": "healthy"}


@app.get("/db-health", tags=["Health"])
async def db_health_check(db: Session = Depends(get_db)):
    """
    Database health check endpoint to verify database connectivity.
    
    This endpoint attempts to create a database session and execute a simple query
    to verify that the database connection is working properly.
    
    Args:
        db: Database session provided by dependency injection
    
    Returns:
        dict: Status information including database connectivity status
    
    Raises:
        HTTPException: If unable to connect to the database
    """
    try:
        # Execute a simple query to test database connectivity
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "message": "Database connection successful"
        }
    except Exception as e:
        # Log the error and return failure status
        logger.error(f"Database health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }


# Health check root endpoint
@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint providing basic API information.
    
    Returns:
        dict: Welcome message and API information
    """
    return {
        "message": "Welcome to Online Exam Management System API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "redoc": "/redoc"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
