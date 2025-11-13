# Online Exam Management System - Backend

FastAPI backend for the Online Exam Management System.

## Prerequisites

- Python 3.9+
- Docker & Docker Compose
- Git

## Project Setup

### 1. Clone and Navigate

```powershell
git clone <repository-url>
cd backend
```

### 2. Create Virtual Environment

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 4. Environment Configuration

```powershell
Copy-Item .env.example .env
```

Edit `.env` with your settings (default values are provided in `.env.example`).

## Database Setup

### Start Docker Containers

```powershell
cd docker
docker-compose up -d
cd ..
```

Verify containers are running:
```powershell
docker-compose -f docker/docker-compose.yml ps
```

### Initialize Database

```powershell
python src/config/init_db.py
```

### Access Database (pgAdmin)

- **URL:** http://localhost:5050
- **Email:** admin@testify.local
- **Password:** admin_password

To register PostgreSQL server in pgAdmin:
- **Host:** postgres
- **Port:** 5432
- **Username:** admin
- **Password:** admin_password
- **Database:** testify_db

## Running the Application

### Start FastAPI Server

**Windows (PowerShell):**
```powershell
.\run_server.ps1
```

**Or manually:**
```powershell
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

**Linux/Mac:**
```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Access API

- **API Docs:** http://localhost:8000/docs
- **Alternative Docs:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health
- **Database Health:** http://localhost:8000/db-health

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── settings.py       # Configuration
│   │   ├── database.py       # SQLAlchemy setup
│   │   └── init_db.py        # Database initialization
│   ├── models/               # Database models
│   ├── routes/               # API endpoints
│   ├── schemas/              # Request/response schemas
│   ├── services/             # Business logic
│   ├── utils/                # Utilities
│   └── main.py              # FastAPI app entry
├── tests/                   # Test files
├── docker/                  # Docker configuration
│   └── docker-compose.yml   # Docker services
├── .env.example            # Environment template
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | postgresql://admin:admin_password@localhost:5432/testify_db | PostgreSQL connection |
| `POSTGRES_DB` | testify_db | Database name |
| `POSTGRES_USER` | admin | Database user |
| `POSTGRES_PASSWORD` | admin_password | Database password |
| `PGADMIN_DEFAULT_EMAIL` | admin@testify.local | pgAdmin login email |
| `PGADMIN_DEFAULT_PASSWORD` | admin_password | pgAdmin login password |
| `JWT_SECRET` | your-secret-key-change-in-production | JWT signing key |
| `JWT_EXPIRATION` | 30 | Token expiration (minutes) |

## Testing

```powershell
pytest
```

## Technologies

- **FastAPI** - Web framework
- **SQLAlchemy** - ORM
- **PostgreSQL** - Database
- **Pydantic** - Data validation
- **Docker** - Containerization

## Next Steps

See `project phases/` directory for detailed phase information:
- Phase 2: Database Setup ✅
- Phase 3: Database Models
- Phase 4: Authentication
- Phase 5+: Features
