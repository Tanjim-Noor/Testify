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

The project uses Alembic for database migrations. To set up the database:

```powershell
# Apply all migrations
alembic upgrade head

# Or use the helper script
.\scripts\migrate.ps1
```

**Note:** The `src/config/init_db.py` script is deprecated. Use Alembic migrations instead.

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

## Database Migrations

This project uses [Alembic](https://alembic.sqlalchemy.org/) for database schema migrations. Alembic allows you to version control your database schema and apply changes incrementally.

### Common Migration Commands

#### Create a New Migration

After modifying SQLAlchemy models, create a migration:

```powershell
alembic revision --autogenerate -m "Description of changes"

# Or use the helper script
.\scripts\create_migration.ps1 "Description of changes"
```

**Important:** Always review the auto-generated migration file before applying it!

#### Apply Migrations

Apply all pending migrations to bring the database up to date:

```powershell
alembic upgrade head

# Or use the helper script
.\scripts\migrate.ps1
```

#### Rollback Migration

Rollback the last migration:

```powershell
alembic downgrade -1

# Or use the helper script
.\scripts\rollback.ps1
```

Rollback all migrations:

```powershell
alembic downgrade base
```

#### View Migration Status

View current migration version:

```powershell
alembic current

# Or use the helper script
.\scripts\current_version.ps1
```

View migration history:

```powershell
alembic history

# Or use the helper script
.\scripts\migration_history.ps1
```

### Migration Best Practices

1. **Always Review Auto-Generated Migrations**
   - Alembic's autogenerate is smart but not perfect
   - Check the generated SQL before applying
   - Add comments for complex changes

2. **Test Migrations Before Production**
   - Test both upgrade and downgrade paths
   - Verify data integrity after migration
   - Test on a copy of production data when possible

3. **Never Edit Applied Migrations**
   - Once a migration is applied, create a new one for changes
   - Keep migration history clean and linear
   - Use `alembic stamp` only when necessary

4. **Keep Migrations Small and Focused**
   - One logical change per migration
   - Makes rollbacks easier
   - Easier to review and debug

5. **Use Descriptive Migration Messages**
   - Good: "Add email_verified field to users table"
   - Bad: "Update users" or "Fix stuff"

6. **Handle Data Migrations Carefully**
   - Separate schema changes from data migrations when possible
   - Use `op.execute()` for custom SQL
   - Consider large dataset implications

### Troubleshooting

#### Migration Conflicts

If you have migration conflicts:

```powershell
# View current state
alembic current

# View history
alembic history

# Stamp database to specific version (use with caution)
alembic stamp <revision_id>
```

#### Database Out of Sync

If your database schema doesn't match your models:

```powershell
# Create a new migration to sync
alembic revision --autogenerate -m "Sync database schema"

# Review and apply
alembic upgrade head
```

#### Reset Database (Development Only)

```powershell
# Rollback all migrations
alembic downgrade base

# Apply all migrations
alembic upgrade head
```

### Helper Scripts

The `scripts/` directory contains PowerShell helpers:

- `create_migration.ps1` - Create new migration
- `migrate.ps1` - Apply all pending migrations
- `rollback.ps1` - Rollback last migration
- `migration_history.ps1` - View migration history
- `current_version.ps1` - View current version

## Project Structure

```
backend/
├── alembic/                 # Database migrations
│   ├── versions/            # Migration files
│   └── env.py              # Alembic environment
├── scripts/                 # Helper scripts
│   ├── create_migration.ps1
│   ├── migrate.ps1
│   ├── rollback.ps1
│   ├── migration_history.ps1
│   └── current_version.ps1
├── src/
│   ├── config/
│   │   ├── settings.py      # Configuration
│   │   ├── database.py      # SQLAlchemy setup
│   │   └── init_db.py       # Database initialization (deprecated)
│   ├── models/              # Database models
│   ├── routes/              # API endpoints
│   ├── schemas/             # Request/response schemas
│   ├── services/            # Business logic
│   ├── utils/               # Utilities
│   └── main.py             # FastAPI app entry
├── tests/                  # Test files
├── docker/                 # Docker configuration
│   └── docker-compose.yml  # Docker services
├── alembic.ini            # Alembic configuration
├── .env.example           # Environment template
├── requirements.txt       # Python dependencies
└── README.md             # This file
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
