"""
Results service provides business logic for student and admin results and statistics.

Simple, straightforward queries with eager loading to avoid N+1. All functions
return Python dictionaries to keep the service layer decoupled from Pydantic models.
"""
from __future__ import annotations

from typing import Dict, Any, List, Optional, cast
from statistics import mean, median, pstdev
from uuid import UUID
from datetime import datetime
import logging

from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError

from src.models.student_exam import StudentExam, ExamStatus
from src.models.exam_question import ExamQuestion
from src.models.student_answer import StudentAnswer
from src.models.exam import Exam
from src.models.question import Question
from src.models.user import User

logger = logging.getLogger(__name__)


def _safe_percent(score: Optional[float], max_score: float) -> Optional[float]:
    if score is None:
        return None
    try:
        if max_score == 0:
            return 0.0
        pct = (float(score) / float(max_score)) * 100.0
        return round(pct, 2)
    except Exception:
        return None


def get_student_result(db: Session, student_exam_id: UUID, student_id: UUID) -> Dict[str, Any]:
    """Return a complete result payload for a student's own exam.

    - Validates ownership
    - Hides correct answers if the exam has not been submitted
    - Includes per-question breakdown and totals
    """
    try:
        se: StudentExam = db.query(StudentExam).options(joinedload(StudentExam.exam).joinedload(Exam.exam_questions).joinedload(ExamQuestion.question), joinedload(StudentExam.student)).filter(StudentExam.id == student_exam_id).first()
        if not se:
            raise ValueError("StudentExam not found")

        if getattr(se, "student_id", None) != student_id:
            raise PermissionError("Student does not own this record")

        # Prepare answers map
        answers = db.query(StudentAnswer).filter(StudentAnswer.student_exam_id == student_exam_id).all()
        answers_map = {a.question_id: a for a in answers}

        # Exam questions ordered
        exam_questions = [eq.question for eq in sorted(se.exam.exam_questions, key=lambda x: x.order_index)]

        max_possible = 0.0
        q_results: List[Dict[str, Any]] = []

        for q in exam_questions:
            max_possible += float(q.max_score or 0)
            sa = answers_map.get(q.id)
            # Student answer payload
            student_ans = sa.answer_value if sa else None
            # Only show correct answers after submission
            show_correct = se.status in (ExamStatus.SUBMITTED, ExamStatus.EXPIRED)
            correct = q.correct_answers if show_correct else None
            is_correct = getattr(sa, "is_correct", None)
            score = cast(Optional[float], getattr(sa, "score", None))
            requires_manual = (q.type in ("text", "image_upload")) or (score is None)

            q_results.append({
                "question_id": q.id,
                "answer_id": sa.id if sa else None,
                "title": q.title,
                "type": q.type,
                "student_answer": student_ans,
                "correct_answer": correct,
                "is_correct": is_correct,
                "score": score,
                "max_score": q.max_score,
                "requires_manual_review": requires_manual,
            })

        total_score = cast(float, se.total_score) if se.total_score is not None else 0.0
        pct = _safe_percent(total_score, max_possible)

        return {
            "student_exam_id": se.id,
            "exam_title": se.exam.title,
            "student_name": se.student.email.split("@")[0],
            "student_email": se.student.email,
            "total_score": total_score,
            "max_possible_score": float(max_possible),
            "percentage": pct,
            "submitted_at": se.submitted_at,
            "status": se.status.value if hasattr(se.status, "value") else str(se.status),
            "question_results": q_results,
        }
    except SQLAlchemyError as e:
        logger.exception("DB error while fetching student result: %s", e)
        db.rollback()
        raise


def get_student_exam_detail(db: Session, student_exam_id: UUID) -> Dict[str, Any]:
    """Return a detailed answer review for a particular student exam (admin view).

    - Includes correct answers and grading breakdown.
    - Does not validate ownership; admin route should handle authorization.
    """
    try:
        se: StudentExam = db.query(StudentExam).options(joinedload(StudentExam.exam).joinedload(Exam.exam_questions).joinedload(ExamQuestion.question), joinedload(StudentExam.student)).filter(StudentExam.id == student_exam_id).first()
        if not se:
            raise ValueError("StudentExam not found")

        answers = db.query(StudentAnswer).filter(StudentAnswer.student_exam_id == student_exam_id).all()
        answers_map = {a.question_id: a for a in answers}

        exam_questions = [eq.question for eq in sorted(se.exam.exam_questions, key=lambda x: x.order_index)]

        q_results = []
        max_possible = 0.0
        for q in exam_questions:
            max_possible += float(q.max_score or 0)
            sa = answers_map.get(q.id)
            student_ans = sa.answer_value if sa else None
            correct = q.correct_answers
            is_correct = getattr(sa, "is_correct", None)
            score = cast(Optional[float], getattr(sa, "score", None))
            requires_manual = (q.type in ("text", "image_upload")) or (score is None)

            q_results.append({
                "question_id": q.id,
                "answer_id": sa.id if sa else None,
                "title": q.title,
                "type": q.type,
                "student_answer": student_ans,
                "correct_answer": correct,
                "is_correct": is_correct,
                "score": score,
                "max_score": q.max_score,
                "requires_manual_review": requires_manual,
            })

        total_score = cast(float, se.total_score) if se.total_score is not None else 0.0
        pct = _safe_percent(total_score, max_possible)

        return {
            "student_exam_id": se.id,
            "exam_title": se.exam.title,
            "student_name": se.student.email.split("@")[0],
            "student_email": se.student.email,
            "total_score": total_score,
            "max_possible_score": float(max_possible),
            "percentage": pct,
            "submitted_at": se.submitted_at,
            "status": se.status.value if hasattr(se.status, "value") else str(se.status),
            "question_results": q_results,
        }
    except SQLAlchemyError as e:
        logger.exception("DB error while fetching student exam details: %s", e)
        db.rollback()
        raise


def get_exam_results_for_admin(db: Session, exam_id: UUID) -> Dict[str, Any]:
    """Return all results for an exam (admin view) and a summarized exam stats.

    - Includes student list with per-student scores and submission timestamps
    - Calculates average/min/max amongst submitted records
    """
    try:
        exam = db.query(Exam).options(joinedload(Exam.student_exams).joinedload(StudentExam.student)).filter(Exam.id == exam_id).first()
        if not exam:
            raise ValueError("Exam not found")

        # student_exams is a relationship; iterate and compute
        se_list = exam.student_exams or []
        total_students = len(se_list)

        scores: List[float] = [float(s.total_score) for s in se_list if s.total_score is not None]
        submission_count = len([s for s in se_list if s.status in (ExamStatus.SUBMITTED, ExamStatus.EXPIRED)])

        avg_score = round(mean(scores), 2) if scores else None
        hi = round(max(scores), 2) if scores else None
        lo = round(min(scores), 2) if scores else None

        student_results = []
        for s in se_list:
            pct = _safe_percent(float(s.total_score) if s.total_score is not None else None, float(sum([q.question.max_score for q in s.exam.exam_questions]) or 0.0))
            student_results.append({
                "student_exam_id": s.id,  # Added missing field
                "student_id": s.student_id,
                "student_name": s.student.email.split("@")[0],
                "student_email": s.student.email,
                "total_score": s.total_score,
                "percentage": pct,
                "submitted_at": s.submitted_at,
                "status": s.status.value if hasattr(s.status, "value") else str(s.status),
            })

        return {
            "exam_summary": {
                "exam_id": exam.id,
                "exam_title": exam.title,
                "total_students": total_students,
                "average_score": avg_score,
                "highest_score": hi,
                "lowest_score": lo,
                "submission_count": submission_count,
            },
            "student_results": student_results,
        }
    except SQLAlchemyError as e:
        logger.exception("DB error while fetching exam results for admin: %s", e)
        db.rollback()
        raise


def calculate_exam_statistics(db: Session, exam_id: UUID) -> Dict[str, Any]:
    """Calculate statistics for an exam.

    Returns mean, median, min, and max and optionally stddev and pass_rate.
    """
    try:
        exam = db.query(Exam).options(joinedload(Exam.student_exams)).filter(Exam.id == exam_id).first()
        if not exam:
            raise ValueError("Exam not found")

        # Consider only submitted/expired exams as 'submitted'
        se_list = [s for s in (exam.student_exams or []) if s.status in (ExamStatus.SUBMITTED, ExamStatus.EXPIRED) and s.total_score is not None]
        scores = [float(s.total_score) for s in se_list]

        stats = {
            "exam_id": exam.id,
            "exam_title": exam.title,
            "submission_count": len(se_list),
            "total_students": len(exam.student_exams or []),
            "average_score": round(mean(scores), 2) if scores else None,
            "median_score": round(median(scores), 2) if scores else None,
            "highest_score": round(max(scores), 2) if scores else None,
            "lowest_score": round(min(scores), 2) if scores else None,
            "stddev": round(pstdev(scores), 2) if scores and len(scores) > 1 else None,
            "pass_rate": None,  # no pass threshold defined on model
        }

        return stats
    except SQLAlchemyError as e:
        logger.exception("DB error while calculating exam statistics: %s", e)
        db.rollback()
        raise