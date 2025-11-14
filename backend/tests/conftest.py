"""Shared fixtures and helpers for the backend test suite."""
from __future__ import annotations

import os
import sys
import json
import sqlite3
from pathlib import Path
from typing import Dict, Generator
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import ARRAY, create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.types import Text, TypeDecorator

from src.config.database import Base, get_db
from src.main import app
from src.utils.auth import create_access_token
from tests.helpers import (
    create_test_exam,
    create_test_question,
    create_test_student_exam,
    create_test_user,
    get_auth_headers,
)


def _add_backend_to_path() -> None:
    """Insert the backend directory into sys.path for test discovery."""

    this_dir = os.path.dirname(__file__)
    backend_root = os.path.abspath(os.path.join(this_dir))
    if backend_root not in sys.path:
        sys.path.insert(0, backend_root)


_add_backend_to_path()

sqlite3.register_adapter(dict, lambda value: json.dumps(value))
sqlite3.register_adapter(list, lambda value: json.dumps(value))


class SqliteJSON(TypeDecorator):
    """Simple JSON encoder/decoder for SQLite-based tests."""

    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return json.loads(value)


class SqliteArray(SqliteJSON):
    """Array compatibility shim leveraging JSON encoding."""

    pass


@compiles(JSONB, "sqlite")
def _jsonb_sqlite(element, compiler, **kw):
    """Render JSONB columns as TEXT when targeting SQLite."""

    return "TEXT"


@compiles(ARRAY, "sqlite")
def _array_sqlite(element, compiler, **kw):
    """Render ARRAY columns as TEXT for SQLite compatibility."""

    return "TEXT"


@pytest.fixture(scope="function")
def test_db(tmp_path_factory) -> Generator[Dict[str, object], None, None]:
    """Provision a brand-new SQLite database for each test function."""

    db_dir = tmp_path_factory.mktemp("test-db")
    db_file = Path(db_dir) / f"pytest_{uuid4().hex}.db"
    engine = create_engine(
        f"sqlite+pysqlite:///{db_file}",
        connect_args={"check_same_thread": False},
        future=True,
    )

    for table in Base.metadata.sorted_tables:
        for column in table.columns:
            if isinstance(column.type, JSONB):
                column.type = SqliteJSON()
            elif isinstance(column.type, ARRAY):
                column.type = SqliteArray()

    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    yield {"engine": engine, "session_factory": session_factory, "path": db_file}

    session_factory.close_all()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if db_file.exists():
        db_file.unlink()


@pytest.fixture(scope="function")
def db_session(test_db) -> Generator[Session, None, None]:
    """Return a unit-of-work style SQLAlchemy session backed by the test DB."""

    session_factory = test_db["session_factory"]
    session: Session = session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """FastAPI TestClient bound to the temporary database session."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def admin_user(db_session: Session):
    """Create and return a persisted admin user for the current test."""

    return create_test_user(db_session, role="admin")


@pytest.fixture(scope="function")
def student_user(db_session: Session):
    """Create and return a persisted student user for the current test."""

    return create_test_user(db_session, role="student")


@pytest.fixture(scope="function")
def sample_questions(db_session: Session):
    """Insert a representative set of single and multi-choice questions."""

    single = create_test_question(db_session, qtype="single_choice")
    multi = create_test_question(db_session, qtype="multi_choice")
    text = create_test_question(db_session, qtype="text")
    return {"single": single, "multi": multi, "text": text}


@pytest.fixture(scope="function")
def sample_exam(db_session: Session, admin_user, sample_questions):
    """Create a published exam with assigned sample questions."""

    exam = create_test_exam(
        db_session,
        admin_id=admin_user.id,
        questions=[sample_questions["single"], sample_questions["multi"], sample_questions["text"]],
        is_published=True,
    )
    return exam


@pytest.fixture(scope="function")
def student_exam(db_session: Session, sample_exam, student_user):
    """Return a StudentExam row linked to the sample exam and student."""

    return create_test_student_exam(db_session, exam_id=sample_exam.id, student_id=student_user.id)


@pytest.fixture(scope="function")
def admin_token(admin_user) -> str:
    """JWT token representing the admin user."""

    return create_access_token({"sub": admin_user.email})


@pytest.fixture(scope="function")
def student_token(student_user) -> str:
    """JWT token representing the student user."""

    return create_access_token({"sub": student_user.email})


@pytest.fixture(scope="function")
def admin_headers(admin_token) -> Dict[str, str]:
    """HTTP Authorization header for admin requests."""

    return get_auth_headers(admin_token)


@pytest.fixture(scope="function")
def student_headers(student_token) -> Dict[str, str]:
    """HTTP Authorization header for student requests."""

    return get_auth_headers(student_token)
