"""
Runner script to start the FastAPI development server.

This script provides an easy way to start the uvicorn server
with appropriate development settings.

Usage:
    python run.py
"""

import uvicorn
from src.config.settings import settings


def main():
    """
    Start the FastAPI development server.
    
    The server runs on localhost:8000 and includes:
    - Auto-reload for development
    - Interactive API docs at /docs
    - ReDoc documentation at /redoc
    """
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )


if __name__ == "__main__":
    main()
