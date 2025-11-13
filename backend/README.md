# Online Exam Management System - Backend

FastAPI backend for the Online Exam Management System.

## Setup Instructions

### 1. Prerequisites
- Python 3.8 or higher
- PostgreSQL (will be set up in Phase 2)

### 2. Virtual Environment Setup

**Windows (PowerShell):**
```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If you get execution policy error, run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies
pip install -r requirements.txt
```

**Linux/Mac:**
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy the example environment file and configure your settings:
```powershell
cp .env.example .env
```

Edit `.env` with your configuration values (database URL, JWT secret, etc.)

### 4. Running the Application

**Option 1 - Using run.py (with venv activated):**
```powershell
# Activate venv first
.\venv\Scripts\Activate.ps1

# Run the server
python run.py
```

**Option 2 - Using PowerShell script (Windows):**
```powershell
.\run_server.ps1
```

**Option 3 - Direct uvicorn command (with venv activated):**
```powershell
# Activate venv first
.\venv\Scripts\Activate.ps1

# Run uvicorn
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Verify Installation

Once the server is running, test the endpoints:

**Health Check:**
```powershell
curl http://localhost:8000/health
# Expected: {"status":"healthy"}
```

**API Documentation:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration and settings
│   ├── models/         # Database models (SQLAlchemy)
│   ├── schemas/        # Pydantic schemas
│   ├── routes/         # API route handlers
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── main.py         # FastAPI application entry point
├── tests/              # Test suite
├── venv/               # Virtual environment (not in git)
├── requirements.txt    # Python dependencies
├── run.py             # Development server script
└── .env               # Environment variables (not in git)
```

## Development

### Running Tests
```powershell
# Activate venv first
.\venv\Scripts\Activate.ps1

# Run tests
pytest
```

### Adding Dependencies
```powershell
# Activate venv first
.\venv\Scripts\Activate.ps1

# Install new package
pip install package-name

# Update requirements.txt
pip freeze > requirements.txt
```

## API Endpoints

### Current Endpoints (Phase 1)
- `GET /` - Root endpoint with API information
- `GET /health` - Health check endpoint
- `GET /docs` - Swagger UI documentation
- `GET /redoc` - ReDoc documentation

### Upcoming Endpoints
See `project phases/` directory for detailed phase information.

## Technologies

- **FastAPI** - Modern, fast web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **PostgreSQL** - Database (Phase 2)
- **Pydantic** - Data validation
- **JWT** - Authentication (Phase 4)
- **pytest** - Testing framework

## Next Steps

Complete the remaining phases in sequence:
1. ✅ Phase 1: Project Setup (Complete)
2. Phase 2: Database Setup
3. Phase 3: Database Models
4. Phase 4: Authentication System
5. ... (See `project phases/phase_00_overview.md`)
