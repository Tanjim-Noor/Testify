from pathlib import Path
from datetime import datetime, timezone, timedelta
import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy import inspect
from sqlalchemy.exc import OperationalError

from src.config.settings import settings
from src.config.database import SessionLocal
from src.schemas.user import UserCreate
from src.schemas.question import QuestionCreate
from src.schemas.exam import ExamCreate, ExamQuestionAssignment, ExamUpdate
from src.services import auth_service, question_service, exam_service, student_exam_service, answer_service, grading_service
from fastapi.testclient import TestClient
from src.schemas.student_exam import AnswerSubmission, ManualGradeRequest
from src.models.student_answer import StudentAnswer
from src.models.question import Question
from src.models.user import User
from uuid import UUID, uuid4
from typing import cast, Any


def _find_alembic_ini(start_path: Path) -> Path:
    p = start_path.resolve()
    for parent in list(p.parents)[:6]:
        cand = parent / "alembic.ini"
        if cand.exists():
            return cand
    raise FileNotFoundError("alembic.ini not found in ancestor dirs")


@pytest.mark.integration
def test_full_auto_grading_and_manual_regrade():
    try:
        engine = create_engine(settings.DATABASE_URL)
        conn = engine.connect()
        conn.close()
    except OperationalError:
        pytest.skip("Postgres DB not available; start docker-compose to run integration tests")

    try:
        alembic_cfg_path = _find_alembic_ini(Path(__file__))
    except FileNotFoundError:
        pytest.skip("alembic.ini not found; skip integration test")
    alembic_cfg = Config(alembic_cfg_path)
    command.upgrade(alembic_cfg, "head")

    # Verify migration added columns
    insp = inspect(engine)
    cols = [c.get('name') for c in insp.get_columns('student_answers')]
    assert 'graded_at' in cols
    assert 'graded_by' in cols

    db = SessionLocal()
    admin_user = None
    student_user = None
    created_exam = None
    created_qs = []
    try:
        admin_user = auth_service.register_user(UserCreate(email=f"admin_grade+{uuid4().hex}@example.com", password="strongpass123", role="admin"), db)
        student_user = auth_service.register_user(UserCreate(email=f"student_grade+{uuid4().hex}@example.com", password="strongpass123", role="student"), db)

        # Create a single choice and multi choice question
        q1 = question_service.create_question(db, QuestionCreate(
            title="SC Q",
            description="Single choice",
            complexity="easy",
            type="single_choice",
            options=["A", "B", "C"],
            correct_answers=["B"],
            max_score=2,
            tags=["grading"],
        ))

        q2 = question_service.create_question(db, QuestionCreate(
            title="MC Q",
            description="Multi choice",
            complexity="easy",
            type="multi_choice",
            options=["A", "B", "C"],
            correct_answers=["A", "C"],
            max_score=3,
            tags=["grading"],
        ))

        q3 = question_service.create_question(db, QuestionCreate(
            title="Text Q",
            description="Manual",
            complexity="medium",
            type="text",
            options=None,
            correct_answers=None,
            max_score=5,
            tags=["grading"],
        ))

        created_qs.extend([q1, q2, q3])

        # Create exam
        start = datetime.now(timezone.utc) - timedelta(minutes=1)
        end = datetime.now(timezone.utc) + timedelta(hours=1)
        exam_payload = ExamCreate(title="Grading Exam", description="For grading tests", start_time=start, end_time=end, duration_minutes=60)
        created_exam = exam_service.create_exam(db, exam_payload, admin_user.id)
        assign_payload = [ExamQuestionAssignment(question_id=cast(UUID, q1.id), order_index=0), ExamQuestionAssignment(question_id=cast(UUID, q2.id), order_index=1), ExamQuestionAssignment(question_id=cast(UUID, q3.id), order_index=2)]
        exam_service.assign_questions(db, cast(UUID, created_exam.id), assign_payload)
        exam_service.publish_exam(db, cast(UUID, created_exam.id), True)

        # Start exam and save answers
        se = student_exam_service.start_exam(db, cast(UUID, created_exam.id), student_user.id)
        assert se is not None

        answer_service.bulk_save_answers(db, cast(UUID, se.id), [
            AnswerSubmission(question_id=cast(UUID, q1.id), answer_value={"answer": "B"}),
            AnswerSubmission(question_id=cast(UUID, q2.id), answer_value={"answers": ["A", "C"]}),
            AnswerSubmission(question_id=cast(UUID, q3.id), answer_value={"text": "My essay"}),
        ])

        # Submit - this triggers grading
        se_sub = student_exam_service.submit_exam(db, cast(UUID, se.id), student_user.id)
        # two objective questions with scores 2 + 3 = 5
        assert se_sub.total_score == 5.0

        # Now regrade: change correct answers for q1 to be A and regrade -> q1 becomes incorrect
        q1.correct_answers = ["A"]
        db.commit()
        new_total = grading_service.regrade_exam(db, cast(UUID, se_sub.id))
        assert new_total == 3.0

        # Manual grade the text answer via service (simulate admin)
        sa = db.query(StudentAnswer).filter(StudentAnswer.question_id == q3.id, StudentAnswer.student_exam_id == se_sub.id).first()
        assert sa is not None
        # Manually assign 4 marks and feedback
        from src.services import grading_service as gs
        sa.score = 4.0
        sa.is_correct = False
        av = sa.answer_value or {}
        av["grader_feedback"] = "Good effort"
        sa.answer_value = av
        db.commit()

        # Recalculate total
        total_after_manual = gs.regrade_exam(db, se_sub.id)
        # After manual 4 marks + q2 (3 marks) = 7
        assert total_after_manual == 7.0

    finally:
        # Cleanup for first test
        if created_exam:
            try:
                from src.models.student_exam import StudentExam

                student_exams = db.query(StudentExam).filter(StudentExam.exam_id == cast(UUID, created_exam.id)).all()
                for se in student_exams:
                    # Use the globally-imported StudentAnswer model (top-level import)
                    db.query(StudentAnswer).filter(StudentAnswer.student_exam_id == cast(UUID, se.id)).delete(synchronize_session=False)
                    db.delete(se)
                db.commit()
                exam_service.delete_exam(db, cast(UUID, created_exam.id))
            except Exception:
                db.rollback()
        for q in created_qs:
            try:
                question_service.delete_question(db, cast(UUID, q.id))
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
        if student_user:
            try:
                obj = db.query(User).filter(User.id == student_user.id).first()
                if obj:
                    db.delete(obj)
                    db.commit()
            except Exception:
                db.rollback()
        db.close()


@pytest.mark.integration
def test_submit_returns_grading_breakdown():
    try:
        engine = create_engine(settings.DATABASE_URL)
        conn = engine.connect()
        conn.close()
    except OperationalError:
        pytest.skip("Postgres DB not available; start docker-compose to run integration tests")

    alembic_cfg = Config(_find_alembic_ini(Path(__file__)))
    command.upgrade(alembic_cfg, "head")

    client = None
    db = SessionLocal()
    admin_user = None
    student_user = None
    created_q = None
    created_exam = None
    try:
        admin_user = auth_service.register_user(UserCreate(email=f"admin_grade+{uuid4().hex}@example.com", password="strongpass123", role="admin"), db)
        student_user = auth_service.register_user(UserCreate(email=f"student_grade+{uuid4().hex}@example.com", password="strongpass123", role="student"), db)

        # Create two objective questions
        q1 = question_service.create_question(db, QuestionCreate(
            title="Q1", description="desc", complexity="easy", type="single_choice", options=["A","B"], correct_answers=["A"], max_score=1, tags=["grading"]
        ))
        q2 = question_service.create_question(db, QuestionCreate(
            title="Q2", description="desc", complexity="easy", type="multi_choice", options=["A","B"], correct_answers=["A"], max_score=2, tags=["grading"]
        ))

        # Create exam and assign
        start = datetime.now(timezone.utc) - timedelta(minutes=1)
        end = datetime.now(timezone.utc) + timedelta(hours=1)
        exam_payload = ExamCreate(title="Exam", description="desc", start_time=start, end_time=end, duration_minutes=60)
        created_exam = exam_service.create_exam(db, exam_payload, admin_user.id)
        assign_payload = [ExamQuestionAssignment(question_id=cast(UUID, q1.id), order_index=0), ExamQuestionAssignment(question_id=cast(UUID, q2.id), order_index=1)]
        exam_service.assign_questions(db, cast(UUID, created_exam.id), assign_payload)
        exam_service.publish_exam(db, cast(UUID, created_exam.id), True)

        # Start exam and answer
        se = student_exam_service.start_exam(db, cast(UUID, created_exam.id), student_user.id)
        answer_service.bulk_save_answers(db, cast(UUID, se.id), [AnswerSubmission(question_id=cast(UUID, q1.id), answer_value={"answer": "A"}), AnswerSubmission(question_id=cast(UUID, q2.id), answer_value={"answers": ["A"]})])

        from src.main import app
        client = TestClient(app)
        # Set student auth override
        from src.utils.dependencies import get_current_student
        app.dependency_overrides[get_current_student] = lambda: student_user

        resp = client.post(f"/api/student/exams/{se.id}/submit")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_score"] == 3.0
        assert isinstance(data["grading_results"], list)
        # Should have two graded items
        assert len(data["grading_results"]) == 2

    finally:
        if created_exam:
            try:
                 # Removed duplicate local import of StudentAnswer
                from src.models.student_exam import StudentExam

                student_exams = db.query(StudentExam).filter(StudentExam.exam_id == cast(UUID, created_exam.id)).all()
                for se in student_exams:
                    db.query(StudentAnswer).filter(StudentAnswer.student_exam_id == cast(UUID, se.id)).delete(synchronize_session=False)
                    db.delete(se)
                db.commit()
                exam_service.delete_exam(db, cast(UUID, created_exam.id))
            except Exception:
                db.rollback()
        if q1:
            try:
                question_service.delete_question(db, cast(UUID, q1.id))
            except Exception:
                db.rollback()
        if q2:
            try:
                question_service.delete_question(db, cast(UUID, q2.id))
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
        if student_user:
            try:
                obj = db.query(User).filter(User.id == student_user.id).first()
                if obj:
                    db.delete(obj)
                    db.commit()
            except Exception:
                db.rollback()
        db.close()

        # No additional queued cleanup needed here; questions created during
        # this test are individually removed above (q1, q2). If any further
        # cleanup is required rely on earlier blocks.

    # End of test cleanup - nothing to do here (moved cleanup to above blocks)
