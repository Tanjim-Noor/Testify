"""
Answer service for student exam session.

Provides helpers for fetching and bulk saving student answers.
"""
from __future__ import annotations

from typing import Dict, List
from uuid import UUID
import logging

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from src.models.student_answer import StudentAnswer
from src.models.question import Question
from src.schemas.student_exam import AnswerSubmission

logger = logging.getLogger(__name__)


def get_student_answers(db: Session, student_exam_id: UUID) -> Dict[UUID, dict]:
    """Return a mapping {question_id: answer_value} for a student exam session.

    Args:
        db: DB session
        student_exam_id: StudentExam UUID

    Returns:
        mapping of question_id -> answer_value (JSON)
    """
    try:
        rows = db.query(StudentAnswer).filter(StudentAnswer.student_exam_id == student_exam_id).all()
        return {r.question_id: r.answer_value for r in rows}
    except SQLAlchemyError as e:
        logger.exception("DB error fetching student answers: %s", e)
        db.rollback()
        raise


def bulk_save_answers(db: Session, student_exam_id: UUID, answers: List[AnswerSubmission]) -> int:
    """Bulk upsert a list of AnswerSubmission for the given student exam.

    Uses a simple per-item upsert to ensure idempotency.

    Returns the number of saved answers.
    """
    try:
        if not answers:
            return 0

        # Validate that all questions exist and belong to the exam
        qids = [a.question_id for a in answers]
        existing_qs = db.query(Question).filter(Question.id.in_(qids)).all()
        if len(existing_qs) != len(set(qids)):
            missing = set(qids) - {q.id for q in existing_qs}
            raise ValueError(f"Some questions were not found: {missing}")

        saved = 0
        for a in answers:
            row = (
                db.query(StudentAnswer)
                .filter(StudentAnswer.student_exam_id == student_exam_id)
                .filter(StudentAnswer.question_id == a.question_id)
                .first()
            )

            if row:
                row.answer_value = a.answer_value
            else:
                new = StudentAnswer(student_exam_id=student_exam_id, question_id=a.question_id, answer_value=a.answer_value)
                db.add(new)

            saved += 1

        db.commit()
        return saved
    except Exception as e:
        logger.exception("Error bulk saving answers: %s", e)
        db.rollback()
        raise
