# Testify - Online Exam Management System

A modern, full-stack web application for managing online examinations with role-based access for administrators and students.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)
- [Environment Configuration](#environment-configuration)
- [Database Management](#database-management)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Testify is a comprehensive online examination system that enables administrators to create and manage question banks, design exams, and track student performance. Students can take exams in a controlled environment with automatic grading and instant results.

## ✨ Features

### Admin Features
- 📝 Question Bank Management with Excel import/export
- 📋 Exam Creation and Configuration
- 👥 Student Management
- 📊 Results Analytics and Grading
- 🔍 Advanced filtering and search capabilities

### Student Features
- 📖 Browse and take assigned exams
- ⏱️ Timed exam sessions with auto-submit
- 📈 View results and performance analytics
- 🔄 Review submitted answers

### System Features
- 🔐 Secure JWT-based authentication
- 👤 Role-based access control (Admin/Student)
- 📱 Responsive Material UI design
- 🚀 Real-time exam state management
- 💾 Automatic data persistence

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI 0.121.1
- **ORM:** SQLAlchemy 2.0.44
- **Database:** PostgreSQL 15
- **Authentication:** JWT (python-jose)
- **Password Hashing:** bcrypt
- **Migrations:** Alembic 1.17.1
- **Testing:** pytest, pytest-cov
- **Server:** Uvicorn (ASGI)

### Frontend
- **Framework:** React 19.2.0
- **Language:** TypeScript 5.9.3
- **Build Tool:** Vite 7.2.2
- **UI Library:** Material-UI (MUI) 7.3.5
- **State Management:** Zustand 5.0.8
- **HTTP Client:** Axios 1.13.2
- **Routing:** React Router DOM 7.9.6
- **Forms:** React Hook Form 7.66.0
- **Charts:** Recharts 3.4.1

### DevOps
- **Containerization:** Docker & Docker Compose
- **Database Admin:** pgAdmin 4
- **Version Control:** Git

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (3.9 or higher) - [Download](https://www.python.org/downloads/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download](https://git-scm.com/downloads/)
- **PostgreSQL** (optional, can use Docker) - [Download](https://www.postgresql.org/download/)

## 🚀 Quick Start

Get the application running in 5 minutes:

```powershell
# 1. Clone the repository
git clone https://github.com/Tanjim-Noor/Testify.git
cd Testify

# 2. Start backend services
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env

# Start database
cd docker
docker-compose up -d
cd ..

# Run migrations
alembic upgrade head

# Start backend server
.\run_server.ps1

# 3. In a new terminal, start frontend
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- pgAdmin: http://localhost:5050

## 📁 Project Structure

```
Testify/
├── backend/                    # FastAPI backend application
│   ├── alembic/               # Database migration scripts
│   │   └── versions/          # Migration version files
│   ├── docker/                # Docker configuration
│   │   └── docker-compose.yml # PostgreSQL & pgAdmin setup
│   ├── docs/                  # Backend documentation
│   ├── scripts/               # Helper scripts for migrations
│   ├── seeds/                 # Database seeding utilities
│   ├── src/                   # Source code
│   │   ├── config/           # Configuration & settings
│   │   ├── models/           # SQLAlchemy database models
│   │   ├── routes/           # API endpoint definitions
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Business logic layer
│   │   ├── utils/            # Utility functions & dependencies
│   │   └── main.py           # Application entry point
│   ├── tests/                 # Test suite
│   ├── uploads/               # File upload storage
│   ├── .env.example           # Environment variables template
│   ├── alembic.ini           # Alembic configuration
│   ├── pytest.ini            # Pytest configuration
│   ├── requirements.txt      # Python dependencies
│   └── run_server.ps1        # Server startup script
│
├── frontend/                  # React frontend application
│   ├── public/               # Static assets
│   ├── src/                  # Source code
│   │   ├── api/             # API client services
│   │   ├── components/      # React components
│   │   │   ├── admin/       # Admin portal components
│   │   │   └── student/     # Student portal components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # Zustand state management
│   │   ├── theme/           # Material-UI theme configuration
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   └── main.tsx         # Application entry point
│   ├── .env.example         # Environment variables template
│   ├── package.json         # Node dependencies & scripts
│   ├── tsconfig.json        # TypeScript configuration
│   └── vite.config.ts       # Vite build configuration
│
├── project phases/           # Development phase documentation
├── scripts/                  # Utility scripts
└── README.md                # This file
```

## ⚙️ Setup Instructions

### Backend Setup

#### 1. Navigate to Backend Directory

```powershell
cd backend
```

#### 2. Create Virtual Environment

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

#### 3. Install Python Dependencies

```powershell
pip install -r requirements.txt
```

#### 4. Configure Environment Variables

```powershell
# Copy the example environment file
Copy-Item .env.example .env

# Edit .env with your preferred editor
notepad .env
```

**Important environment variables to configure:**

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://admin:admin_password@postgres:5432/testify_db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key-change-in-production` |
| `JWT_EXPIRATION` | Token expiration in minutes | `30` |
| `DEBUG` | Enable debug mode | `False` |

#### 5. Start Database Services

```powershell
cd docker
docker-compose up -d
cd ..
```

Verify containers are running:
```powershell
docker-compose -f docker/docker-compose.yml ps
```

#### 6. Run Database Migrations

```powershell
# Apply all migrations
alembic upgrade head

# Or use the helper script
.\scripts\migrate.ps1
```

#### 7. (Optional) Seed Database with Sample Data

```powershell
# Seed all data
python -u scripts/seed.py all

# Or seed specific data
python -u scripts/seed.py users
python -u scripts/seed.py questions
python -u scripts/seed.py exams
```

**Note:** Seeding requires `DEBUG=True` in your `.env` file.

### Frontend Setup

#### 1. Navigate to Frontend Directory

```powershell
cd frontend
```

#### 2. Install Node Dependencies

```powershell
npm install
```

#### 3. Configure Environment Variables

```powershell
# Copy the example environment file
Copy-Item .env.example .env

# Edit .env with your preferred editor
notepad .env
```

**Frontend environment variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000` |
| `VITE_APP_NAME` | Application name | `Testify` |
| `VITE_APP_VERSION` | Application version | `0.1.0` |

#### 4. Generate Excel Template (Optional)

```powershell
npm run generate:template
```

This creates a question import template at `public/questions_template.xlsx` with three sample questions:
- **Single Choice:** HTTP status code question (Web Dev)
- **Text (Open-ended):** React hooks comparison question (Frontend)
- **Multi-Choice:** Identifying fruits question (General Knowledge)

The template demonstrates the correct Excel format for importing questions into the system. You can modify these examples or use them as a reference when creating your own question bank.

## 🚀 Running the Application

### Start Backend Server

**Option 1: Using the startup script (Windows)**
```powershell
cd backend
.\run_server.ps1
```

**Option 2: Manual start**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

**Linux/Mac:**
```bash
cd backend
source venv/bin/activate
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at:
- **API:** http://localhost:8000
- **Swagger Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Start Frontend Development Server

```powershell
cd frontend
npm run dev
```

The frontend will be available at http://localhost:3000

### Access Database Administration

**pgAdmin:**
- **URL:** http://localhost:5050
- **Email:** admin@example.com (from .env)
- **Password:** admin_password (from .env)

**Register PostgreSQL Server in pgAdmin:**
1. Click "Add New Server"
2. **General Tab:** Name: `Testify DB`
3. **Connection Tab:**
   - Host: `postgres`
   - Port: `5432`
   - Database: `testify_db`
   - Username: `admin`
   - Password: `admin_password`

## 🔧 Environment Configuration

### Backend Environment Variables (.env)

```env
# Database Configuration
DATABASE_URL=postgresql://admin:admin_password@postgres:5432/testify_db
POSTGRES_DB=testify_db
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin_password

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION=30

# CORS Configuration
CORS_ORIGINS=["http://localhost:3000","http://localhost:8000","http://127.0.0.1:3000"]

# Application Configuration
APP_TITLE=Online Exam Management System
APP_VERSION=0.1.0
DEBUG=False

# pgAdmin Configuration
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=admin_password
```

### Frontend Environment Variables (.env)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Testify
VITE_APP_VERSION=0.1.0
```

## 🗄️ Database Management

### Migration Commands

#### Create a New Migration

```powershell
# Auto-generate migration from model changes
alembic revision --autogenerate -m "Description of changes"

# Or use helper script
.\scripts\create_migration.ps1 "Description of changes"
```

#### Apply Migrations

```powershell
# Apply all pending migrations
alembic upgrade head

# Or use helper script
.\scripts\migrate.ps1
```

#### Rollback Migration

```powershell
# Rollback last migration
alembic downgrade -1

# Rollback to specific version
alembic downgrade <revision_id>

# Or use helper script
.\scripts\rollback.ps1
```

#### View Migration Status

```powershell
# Show current version
alembic current

# Show migration history
alembic history

# Or use helper scripts
.\scripts\current_version.ps1
.\scripts\migration_history.ps1
```

### Database Seeding (Development Only)

```powershell
cd backend

# Seed all data
python -u scripts/seed.py all

# Seed specific data types
python -u scripts/seed.py users
python -u scripts/seed.py questions
python -u scripts/seed.py exams
python -u scripts/seed.py exam-questions
python -u scripts/seed.py student-exams
python -u scripts/seed.py student-answers

# Clean all seeded data
python -u scripts/seed.py clean --force

# Verify seeded data
python -u scripts/verify_seeds.py
```

**Note:** Seeding requires `DEBUG=True` in `.env` unless using `--force` flag.

## 🧪 Testing

### Backend Tests

The backend includes comprehensive pytest test suites with 80% coverage requirement.

#### Run All Tests

```powershell
cd backend
pytest -vv
```

#### Run Tests with Coverage

```powershell
pytest -vv --cov=src --cov-report=html
```

View coverage report at `backend/htmlcov/index.html`

#### Run Specific Test Suites

```powershell
# Authentication tests
pytest -vv tests/comprehensive\ testing/test_auth.py

# Service layer tests
pytest -vv tests/comprehensive\ testing/test_services_core.py

# Phase-based tests
pytest backend/tests/phase_08_student_exam -q

# Run by keyword
pytest -vv -k "test_grade"
```

#### Integration Tests (Requires Running Database)

```powershell
# Start database
cd docker
docker-compose up -d
cd ..

# Run integration tests
pytest -q -m integration
```

#### Test Organization

Tests are organized by development phase:
- `tests/phase_05_excel_import/` - Excel import functionality
- `tests/phase_06_question_crud/` - Question CRUD operations
- `tests/phase_07_exam_management/` - Exam management
- `tests/phase_08_student_exam/` - Student exam workflow

### Frontend Tests

```powershell
cd frontend

# Run linter
npm run lint

# Build test
npm run build

# Preview production build
npm run preview
```

## 📚 API Documentation

### Interactive Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Main API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

#### Admin - Questions
- `GET /api/admin/questions` - List all questions
- `POST /api/admin/questions` - Create new question
- `POST /api/admin/questions/import` - Import questions from Excel
- `GET /api/admin/questions/export` - Export questions to Excel
- `PUT /api/admin/questions/{id}` - Update question
- `DELETE /api/admin/questions/{id}` - Delete question

#### Admin - Exams
- `GET /api/admin/exams` - List all exams
- `POST /api/admin/exams` - Create new exam
- `PUT /api/admin/exams/{id}` - Update exam
- `DELETE /api/admin/exams/{id}` - Delete exam
- `POST /api/admin/exams/{id}/publish` - Publish exam

#### Student - Exams
- `GET /api/student/exams` - List available exams
- `POST /api/student/exams/{id}/start` - Start exam
- `POST /api/student/exams/{id}/submit` - Submit exam
- `GET /api/student/exams/{id}/results` - Get exam results

#### Results
- `GET /api/results/{student_exam_id}` - Get detailed results
- `GET /api/admin/results` - Admin view all results

For complete API documentation with request/response schemas, see `backend/docs/BACKEND_API_DOCUMENTATION.md`

## 🔒 Security Best Practices

1. **Change Default Credentials**
   - Update `JWT_SECRET` in production
   - Change database passwords
   - Update pgAdmin credentials

2. **Environment Variables**
   - Never commit `.env` files
   - Use strong, unique secrets in production
   - Rotate JWT secrets periodically

3. **Database**
   - Use strong passwords
   - Enable SSL for production databases
   - Regular backups

4. **CORS**
   - Configure `CORS_ORIGINS` for production domains
   - Restrict to necessary origins only

## 🐳 Docker Deployment

### Build and Run with Docker

```powershell
# Build backend image
docker build -t testify-backend ./backend

# Build frontend image
docker build -t testify-frontend ./frontend

# Run complete stack
docker-compose up -d
```

### Production Considerations

1. Use environment-specific `.env` files
2. Enable HTTPS/SSL certificates
3. Configure reverse proxy (nginx/traefik)
4. Set up monitoring and logging
5. Enable database backups
6. Use managed database services (AWS RDS, etc.)

## 📖 Development Guidelines

### Backend Development

1. **Code Style**
   - Follow PEP 8 guidelines
   - Use type hints
   - Write docstrings for functions

2. **Database Changes**
   - Always use Alembic migrations
   - Never edit applied migrations
   - Test migrations before committing

3. **Testing**
   - Write tests for new features
   - Maintain 80% coverage minimum
   - Test both success and error cases

### Frontend Development

1. **Code Style**
   - Use TypeScript strict mode
   - Follow ESLint rules
   - Use functional components and hooks

2. **State Management**
   - Use Zustand for global state
   - Keep component state local when possible
   - Use React Hook Form for forms

3. **API Integration**
   - Use centralized API client (`src/utils/apiClient`)
   - Handle errors consistently
   - Implement proper loading states

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Commit Message Convention

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 🐛 Troubleshooting

### Backend Issues

**Database connection errors:**
```powershell
# Check if Docker containers are running
docker-compose -f backend/docker/docker-compose.yml ps

# Restart containers
cd backend/docker
docker-compose restart
```

**Migration errors:**
```powershell
# Check current migration state
alembic current

# Reset database (development only)
alembic downgrade base
alembic upgrade head
```

**Import errors:**
```powershell
# Ensure virtual environment is activated
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt
```

### Frontend Issues

**Port already in use:**
```powershell
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Build errors:**
```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

**API connection issues:**
- Verify `VITE_API_BASE_URL` in `.env`
- Check backend is running on correct port
- Verify CORS settings in backend `.env`

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Tanjim Noor** - [GitHub](https://github.com/Tanjim-Noor)

## 🙏 Acknowledgments

- FastAPI framework and community
- React and Material-UI teams
- All contributors and testers

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for education**
