from pathlib import Path
from datetime import datetime, timezone, timedelta
import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

from src.config.settings import settings
from src.config.database import SessionLocal
from src.schemas.user import UserCreate
from src.schemas.question import QuestionCreate
from src.schemas.exam import ExamCreate, ExamQuestionAssignment, ExamUpdate
from src.services import auth_service, question_service, exam_service, student_exam_service, answer_service
from src.schemas.student_exam import AnswerSubmission
from src.models.user import User


def _find_alembic_ini(start_path: Path) -> Path:
    # Look for alembic.ini up to repo root (handle tests in nested phase folders)
    p = start_path.resolve()
    for parent in list(p.parents)[:6]:
        cand = parent / "alembic.ini"
        if cand.exists():
            return cand
    raise FileNotFoundError("alembic.ini not found in ancestor dirs")


@pytest.mark.integration
def test_get_available_exams_service():
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

    db = SessionLocal()
    admin_user = None
    created_exams = []
    try:
        admin_user = auth_service.register_user(UserCreate(email="admin_avail@example.com", password="strongpass123", role="admin"), db)

        now = datetime.now(timezone.utc)
        # create a question to assign to exams
        q_payload = QuestionCreate(
            title="Availability Q",
            description="Used for availability test",
            complexity="easy",
            type="text",
            options=None,
            correct_answers=None,
            max_score=1,
            tags=["integration", "availability"],
        )
        created_q = question_service.create_question(db, q_payload)

        # create exams with different windows
        # create exams with a valid future start_time (ExamCreate enforces > now),
        # then update times to create past/current/future windows
        future_start = now + timedelta(days=2)
        exam1 = ExamCreate(title="Past Exam", description="past", start_time=future_start, end_time=future_start + timedelta(hours=2), duration_minutes=60)
        exam2 = ExamCreate(title="Current Exam", description="current", start_time=future_start, end_time=future_start + timedelta(hours=2), duration_minutes=60)
        exam3 = ExamCreate(title="Future Exam", description="future", start_time=future_start, end_time=future_start + timedelta(hours=2), duration_minutes=60)

        e1 = exam_service.create_exam(db, exam1, admin_user.id)
        e2 = exam_service.create_exam(db, exam2, admin_user.id)
        e3 = exam_service.create_exam(db, exam3, admin_user.id)
        created_exams.extend([e1, e2, e3])

        # Update times to represent past/current/future states then publish
        # Past exam: start and end in the past
        past_start = now - timedelta(days=2)
        past_end = now - timedelta(days=1)
        exam_service.update_exam(db, e1.id, ExamUpdate(start_time=past_start, end_time=past_end))

        # Current exam: started recently and ends in future
        current_start = now - timedelta(minutes=10)
        current_end = now + timedelta(hours=1)
        exam_service.update_exam(db, e2.id, ExamUpdate(start_time=current_start, end_time=current_end))

        # Future exam: leave as-is (already has future_start)
        # Assign the question to all exams
        assn = [ExamQuestionAssignment(question_id=created_q.id, order_index=0)]
        exam_service.assign_questions(db, e1.id, assn)
        exam_service.assign_questions(db, e2.id, assn)
        exam_service.assign_questions(db, e3.id, assn)

        # Publish all
        exam_service.publish_exam(db, e1.id, True)
        exam_service.publish_exam(db, e2.id, True)
        exam_service.publish_exam(db, e3.id, True)

        # student user
        student = auth_service.register_user(UserCreate(email="avail_student@example.com", password="strongpass123", role="student"), db)

        av = student_exam_service.get_available_exams(db, student.id)
        assert isinstance(av, list)
        # all published exams are returned
        titles = [a.title for a in av]
        assert "Past Exam" in titles
        assert "Current Exam" in titles
        assert "Future Exam" in titles

    finally:
        for ex in created_exams:
            try:
                exam_service.delete_exam(db, ex.id)
            except Exception:
                db.rollback()
        if created_q:
            try:
                question_service.delete_question(db, created_q.id)
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


@pytest.mark.integration
def test_student_exam_start_save_submit():
    # Skip if Postgres not reachable
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

    db = SessionLocal()
    admin_user = None
    student_user = None
    created_q = None
    created_exam = None

    try:
        # Create admin and student users
        admin_user = auth_service.register_user(UserCreate(email="admin_student@example.com", password="strongpass123", role="admin"), db)
        student_user = auth_service.register_user(UserCreate(email="student@example.com", password="strongpass123", role="student"), db)

        # Create a question
        question_payload = QuestionCreate(
            title="Integration student question",
            description="Integration test student",
            complexity="int-test",
            type="text",
            options=None,
            correct_answers=["A"],
            max_score=1,
            tags=["integration", "student"],
        )
        created_q = question_service.create_question(db, question_payload)

        # Create exam with valid future start_time then update times to allow start immediately
        future_start = datetime.now(timezone.utc) + timedelta(days=1)
        exam_payload = ExamCreate(title="Student Exam", description="Student exam flow", start_time=future_start, end_time=future_start + timedelta(hours=2), duration_minutes=60)

        created_exam = exam_service.create_exam(db, exam_payload, admin_user.id)
        # Update to make it available now
        start = datetime.now(timezone.utc) - timedelta(minutes=1)
        end = datetime.now(timezone.utc) + timedelta(hours=1)
        exam_service.update_exam(db, created_exam.id, ExamUpdate(start_time=start, end_time=end))

        # Assign question
        assign_payload = [ExamQuestionAssignment(question_id=created_q.id, order_index=0)]
        exam_service.assign_questions(db, created_exam.id, assign_payload)

        # Publish
        exam_service.publish_exam(db, created_exam.id, True)

        # Start exam for student
        se = student_exam_service.start_exam(db, created_exam.id, student_user.id)
        assert se is not None
        assert se.status.name == "IN_PROGRESS"

        # Save answer through the answer_service (JSONB)
        from src.models.question import Question
        q = db.query(Question).filter(Question.id == created_q.id).first()
        assert q is not None

        answer = answer_service.bulk_save_answers(db, se.id, [AnswerSubmission(question_id=created_q.id, answer_value={'text': 'integration'})])
        assert answer == 1

        # Ensure student answers exist
        from src.models.student_answer import StudentAnswer
        saved = db.query(StudentAnswer).filter(StudentAnswer.student_exam_id == se.id).all()
        assert len(saved) == 1

        # Submit
        se_sub = student_exam_service.submit_exam(db, se.id, student_user.id)
        assert se_sub.status.name == "SUBMITTED"
        assert se_sub.submitted_at is not None

    finally:
        # Cleanup
        if created_exam:
            try:
                # Remove any student submissions to allow exam deletion
                from src.models.student_exam import StudentExam
                from src.models.student_answer import StudentAnswer

                student_exams = db.query(StudentExam).filter(StudentExam.exam_id == created_exam.id).all()
                for se in student_exams:
                    # Delete answers first
                    db.query(StudentAnswer).filter(StudentAnswer.student_exam_id == se.id).delete(synchronize_session=False)
                    db.delete(se)
                db.commit()
                exam_service.delete_exam(db, created_exam.id)
            except Exception:
                db.rollback()
        if created_q:
            try:
                question_service.delete_question(db, created_q.id)
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
def test_student_exam_auto_expiry():
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

    db = SessionLocal()
    admin_user = None
    student_user = None
    created_q = None
    created_exam = None

    try:
        admin_user = auth_service.register_user(UserCreate(email="admin_exp@example.com", password="strongpass123", role="admin"), db)
        student_user = auth_service.register_user(UserCreate(email="student_exp@example.com", password="strongpass123", role="student"), db)

        question_payload = QuestionCreate(
            title="Expiry question",
            description="Expiry test",
            complexity="int-test",
            type="text",
            options=None,
            correct_answers=None,
            max_score=1,
            tags=["integration", "expiry"],
        )
        created_q = question_service.create_question(db, question_payload)

        # Create exam with 1 minute duration so it can expire quickly
        future_start = datetime.now(timezone.utc) + timedelta(days=1)
        start = datetime.now(timezone.utc) - timedelta(minutes=1)
        end = datetime.now(timezone.utc) + timedelta(minutes=10)
        exam_payload = ExamCreate(
            title="Expiry Exam",
            description="Expiry quick exam",
            start_time=future_start,
            end_time=future_start + timedelta(minutes=10),
            duration_minutes=1,  # immediate expiry window
        )
        # Create and then update duration to 1 minute so pydantic validation passes
        created_exam = exam_service.create_exam(db, exam_payload, admin_user.id)
        exam_service.update_exam(db, created_exam.id, ExamUpdate(start_time=start, end_time=end, duration_minutes=1))
        assign_payload = [ExamQuestionAssignment(question_id=created_q.id, order_index=0)]
        exam_service.assign_questions(db, created_exam.id, assign_payload)
        exam_service.publish_exam(db, created_exam.id, True)

        se = student_exam_service.start_exam(db, created_exam.id, student_user.id)
        assert se is not None

        # Manually set started_at to be old (more than allowed + grace seconds)
        from src.models.student_exam import StudentExam
        student_exam_obj = db.query(StudentExam).filter(StudentExam.id == se.id).first()
        assert student_exam_obj is not None
        # Set started_at in the past exceeding duration + GRACE_SECONDS
        # Use a large delta to ensure it exceeds the allowed duration
        student_exam_obj.started_at = datetime.now(timezone.utc) - timedelta(minutes=5)
        db.commit()

        # Trigger check
        expired = student_exam_service.check_and_expire_exam(db, student_exam_obj)
        assert expired is True
        db.refresh(student_exam_obj)
        assert student_exam_obj.status.name == "EXPIRED"
        assert student_exam_obj.submitted_at is not None

    finally:
        if created_exam:
            try:
                from src.models.student_exam import StudentExam
                from src.models.student_answer import StudentAnswer

                student_exams = db.query(StudentExam).filter(StudentExam.exam_id == created_exam.id).all()
                for se in student_exams:
                    db.query(StudentAnswer).filter(StudentAnswer.student_exam_id == se.id).delete(synchronize_session=False)
                    db.delete(se)
                db.commit()
                exam_service.delete_exam(db, created_exam.id)
            except Exception:
                db.rollback()
        if created_q:
            try:
                question_service.delete_question(db, created_q.id)
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
