"""Integration tests for question service with a real Postgres DB.

These tests are intended to be run with Postgres available, e.g. from
`backend/docker/docker-compose.yml` by running `docker-compose up -d` before
running pytest.

They call Alembic programmatically to ensure the latest migration is applied.
"""
from pathlib import Path
import time

import pytest
from alembic.config import Config
from alembic import command
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

from src.config.settings import settings
from src.config.database import SessionLocal
from src.schemas.question import QuestionCreate, QuestionFilter, PaginationParams
from src.services import question_service


@pytest.mark.integration
def test_question_service_create_and_query():
    """Create a question and query it back using get_questions()."""
    # Skip if Postgres is not running (this is an integration test)
    try:
        engine = create_engine(settings.DATABASE_URL)
        conn = engine.connect()
        conn.close()
    except OperationalError:
        pytest.skip("Postgres DB not available; start docker-compose to run integration tests")

    # Run migrations to ensure schema exists
    # alembic.ini is at workspace root in backend
    alembic_cfg = Config(Path(__file__).resolve().parents[1] / "alembic.ini")
    command.upgrade(alembic_cfg, "head")

    session = SessionLocal()
    created_id = None
    try:
        # Create a question using the service
        payload = QuestionCreate(
            title="Integration test question",
            description="Integration test",
            complexity="int-test",
            type="text",
            options=None,
            correct_answers=["A"],
            max_score=1,
            tags=["integration", "test"],
        )

        created = question_service.create_question(session, payload)
        created_id = created.id
        assert created.id is not None

        # Wait briefly for Postgres to register indexes/committed row in case of replication
        time.sleep(0.25)

        # Query with no filters (explicitly pass None to satisfy type-checkers)
        filters = QuestionFilter(complexity=None, type=None, tags=None, search=None)
        pagination = PaginationParams(page=1, limit=10)
        results, total = question_service.get_questions(session, filters, pagination)
        assert total >= 1

        # Query by tags - should match our created question
        filters = QuestionFilter(complexity=None, type=None, tags=["integration"], search=None)  # ANY matching tag
        results, total = question_service.get_questions(session, filters, pagination)
        assert any(str(r.id) == str(created_id) for r in results)

    finally:
        # Cleanup
        if created_id is not None:
            try:
                question_service.delete_question(session, created_id)  # type: ignore[arg-type]
            except SQLAlchemyError:
                session.rollback()
        session.close()
