"""
Student exam service provides business logic for student participation flows.

Includes: listing available exams, starting exams, saving answers, submitting and expiring.
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from uuid import UUID
from typing import Dict, Any, List
import logging

from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError

from src.models.exam import Exam
from src.models.student_exam import StudentExam, ExamStatus
from src.models.student_answer import StudentAnswer
from src.models.exam_question import ExamQuestion
from src.models.question import Question
from src.schemas.student_exam import AnswerSubmission
from src.services.answer_service import get_student_answers

logger = logging.getLogger(__name__)


GRACE_SECONDS = 30


def get_available_exams(db: Session, student_id: UUID) -> List[Exam]:
    """Return list of exams available to the given student.

    - Only published exams are visible
    - Returns exams with a lightweight StudentExam join if present
    """
    try:
        now = datetime.now(timezone.utc)
        # Get published exams
        query = db.query(Exam).options(joinedload(Exam.exam_questions))
        exams = query.filter(Exam.is_published == True).all()

        # Filter exams base on time window; annotate status
        available = []
        for exam in exams:
            if exam.start_time <= now <= exam.end_time:
                available.append(exam)
            elif now < exam.start_time:
                available.append(exam)
            else:
                # ended
                available.append(exam)

        return available
    except SQLAlchemyError as e:
        logger.exception("DB error while fetching available exams: %s", e)
        db.rollback()
        raise


def start_exam(db: Session, exam_id: UUID, student_id: UUID) -> StudentExam:
    """Create or resume a StudentExam instance for the student.

    - Validates the exam is published and within the configured time window
    - If an in-progress record exists, returns it (resume)
    - If submitted/expired, raises ValueError
    """
    try:
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        if not exam:
            raise ValueError("Exam not found")

        now = datetime.now(timezone.utc)
        if not exam.is_published:
            raise ValueError("Exam is not published")

        if now < exam.start_time or now > exam.end_time:
            raise ValueError("Exam is not currently available")

        # Check existing StudentExam
        se = db.query(StudentExam).filter(StudentExam.exam_id == exam_id, StudentExam.student_id == student_id).first()
        if se:
            if se.status == ExamStatus.IN_PROGRESS:
                return se
            if se.status in (ExamStatus.SUBMITTED, ExamStatus.EXPIRED):
                raise ValueError("Exam already submitted or expired")

        # Create new StudentExam
        new = StudentExam(exam_id=exam_id, student_id=student_id, status=ExamStatus.IN_PROGRESS, started_at=now)
        db.add(new)
        db.commit()
        db.refresh(new)
        return new
    except SQLAlchemyError as e:
        logger.exception("DB error starting exam: %s", e)
        db.rollback()
        raise


def get_exam_session(db: Session, student_exam_id: UUID, student_id: UUID) -> Dict[str, Any]:
    """Return session state for a student including questions and existing answers.

    Will auto-expire the record if time elapsed.
    """
    try:
        se = db.query(StudentExam).filter(StudentExam.id == student_exam_id).first()
        if not se:
            raise ValueError("StudentExam not found")

        if se.student_id != student_id:
            raise PermissionError("Invalid student ownership")

        # Check and expire if needed
        expired = check_and_expire_exam(db, se)

        # Build session
        exam = db.query(Exam).options(joinedload(Exam.exam_questions).joinedload(ExamQuestion.question)).filter(Exam.id == se.exam_id).first()
        if not exam:
            raise ValueError("Exam not found")

        # Questions ordered by exam_question.order_index
        questions = [q.question for q in sorted(exam.exam_questions, key=lambda x: x.order_index)]

        answers = get_student_answers(db, student_exam_id)

        # Time remaining
        time_remaining = 0
        if se.started_at and se.status == ExamStatus.IN_PROGRESS:
            end_time = se.started_at + timedelta(minutes=exam.duration_minutes)
            time_remaining = int((end_time - datetime.now(timezone.utc)).total_seconds())
            if time_remaining < 0:
                time_remaining = 0

        return {
            "student_exam": se,
            "exam": exam,
            "questions": questions,
            "answers": answers,
            "time_remaining": time_remaining,
            "expired": expired,
        }
    except SQLAlchemyError as e:
        logger.exception("DB error while fetching exam session: %s", e)
        db.rollback()
        raise


def save_answer(db: Session, student_exam_id: UUID, student_id: UUID, answer: AnswerSubmission) -> bool:
    """Save or update a single answer for a student exam session.

    Returns True when saved successfully. This endpoint should be fast and idempotent.
    """
    try:
        se = db.query(StudentExam).filter(StudentExam.id == student_exam_id).first()
        if not se:
            raise ValueError("StudentExam not found")

        if se.student_id != student_id:
            raise PermissionError("Invalid student ownership")

        if se.status != ExamStatus.IN_PROGRESS:
            raise ValueError("Cannot save answer; exam not in progress")

        # Check expiration
        expired = check_and_expire_exam(db, se)
        if expired:
            raise ValueError("Exam time expired")

        # Validate question belongs to exam
        q = db.query(Question).filter(Question.id == answer.question_id).first()
        if not q:
            raise ValueError("Question not found")

        # Upsert StudentAnswer
        row = db.query(StudentAnswer).filter(StudentAnswer.student_exam_id == student_exam_id, StudentAnswer.question_id == answer.question_id).first()
        if row:
            row.answer_value = answer.answer_value
        else:
            row = StudentAnswer(student_exam_id=student_exam_id, question_id=answer.question_id, answer_value=answer.answer_value)
            db.add(row)

        db.commit()
        return True
    except SQLAlchemyError as e:
        logger.exception("DB error saving answer: %s", e)
        db.rollback()
        raise


def submit_exam(db: Session, student_exam_id: UUID, student_id: UUID) -> StudentExam:
    """Submit a student's exam. Returns updated StudentExam instance.

    - Validates ownership and current status
    - Sets submitted_at and updates status
    """
    try:
        se = db.query(StudentExam).filter(StudentExam.id == student_exam_id).first()
        if not se:
            raise ValueError("StudentExam not found")

        if se.student_id != student_id:
            raise PermissionError("Invalid student ownership")

        if se.status == ExamStatus.SUBMITTED:
            raise ValueError("Exam already submitted")

        if se.status == ExamStatus.EXPIRED:
            raise ValueError("Cannot submit; exam expired")

        se.status = ExamStatus.SUBMITTED
        se.submitted_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(se)
        return se
    except SQLAlchemyError as e:
        logger.exception("DB error while submitting exam: %s", e)
        db.rollback()
        raise


def check_and_expire_exam(db: Session, student_exam: StudentExam) -> bool:
    """Check if time elapsed for a StudentExam has passed and expire if necessary.

    If expired, set status to EXPIRED and submitted_at to now.
    Returns True if it was expired, False otherwise.
    """
    try:
        if not student_exam.started_at or student_exam.status != ExamStatus.IN_PROGRESS:
            return False

        exam = db.query(Exam).filter(Exam.id == student_exam.exam_id).first()
        if not exam:
            raise ValueError("Exam not found")

        elapsed = (datetime.now(timezone.utc) - student_exam.started_at).total_seconds()
        allowed = exam.duration_minutes * 60 + GRACE_SECONDS

        if elapsed > allowed:
            # Expire and auto-submit
            student_exam.status = ExamStatus.EXPIRED
            student_exam.submitted_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(student_exam)
            return True

        return False
    except SQLAlchemyError as e:
        logger.exception("DB error checking expiry: %s", e)
        db.rollback()
        raise
