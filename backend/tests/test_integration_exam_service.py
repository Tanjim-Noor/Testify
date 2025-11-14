from pathlib import Path
import time
from datetime import datetime, timezone, timedelta
import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

from src.config.settings import settings
from src.config.database import SessionLocal
from src.schemas.question import QuestionCreate, QuestionFilter, PaginationParams
from src.schemas.user import UserCreate
from src.schemas.exam import ExamCreate, ExamQuestionAssignment
from typing import cast
from uuid import UUID

from src.services import question_service, exam_service, auth_service
from src.models.user import User


@pytest.mark.integration
def test_exam_management_create_assign_publish():
    # Skip if Postgres not reachable
    try:
        engine = create_engine(settings.DATABASE_URL)
        conn = engine.connect()
        conn.close()
    except OperationalError:
        pytest.skip("Postgres DB not available; start docker-compose to run integration tests")

    # Apply migrations
    alembic_cfg = Config(Path(__file__).resolve().parents[1] / "alembic.ini")
    command.upgrade(alembic_cfg, "head")

    db = SessionLocal()
    admin_user = None
    created_q = None
    created_exam = None

    try:
        # Create admin user
        admin_payload = UserCreate(email="exam_admin@example.com", password="strongpass123", role="admin")
        admin_user = auth_service.register_user(admin_payload, db)

        # Create a question
        question_payload = QuestionCreate(
            title="Integration exam question",
            description="Integration test",
            complexity="int-test",
            type="text",
            options=None,
            correct_answers=["A"],
            max_score=1,
            tags=["integration", "exam"],
        )
        created_q = question_service.create_question(db, question_payload)
        assert created_q.id is not None

        # Create exam
        start = datetime.now(timezone.utc) + timedelta(days=1)
        end = start + timedelta(hours=2)
        exam_payload = ExamCreate(
            title="Integration Exam",
            description="Exam created in integration test",
            start_time=start,
            end_time=end,
            duration_minutes=60,
        )

        created_exam = exam_service.create_exam(db, exam_payload, admin_user.id)
        assert created_exam.id is not None

        # Assign question
        assign_payload = [ExamQuestionAssignment(question_id=cast(UUID, created_q.id), order_index=0)]
        updated_exam = exam_service.assign_questions(db, cast(UUID, created_exam.id), assign_payload)
        # check assignment
        assert any(str(q.question_id) == str(created_q.id) for q in updated_exam.exam_questions)

        # Publish exam
        pub_exam = exam_service.publish_exam(db, cast(UUID, created_exam.id), True)
        assert pub_exam is not None and pub_exam.is_published is True

    finally:
        # Cleanup
        if created_exam:
            try:
                exam_service.delete_exam(db, cast(UUID, created_exam.id))
            except Exception:
                db.rollback()
        if created_q:
            try:
                question_service.delete_question(db, created_q.id)  # type: ignore[arg-type]
            except Exception:
                db.rollback()
        if admin_user:
            try:
                obj = db.query(User).filter(User.id == admin_user.id).first()
                if obj:
                    db.delete(obj)
                    db.commit()
            except Exception:
                db.rollback()
        db.close()
