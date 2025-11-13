"""
Main FastAPI application entry point for the Online Exam Management System backend.

This module initializes the FastAPI application with CORS middleware,
startup event handlers, and core health check endpoint.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config.settings import settings

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
