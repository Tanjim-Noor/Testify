from __future__ import annotations

from typing import Tuple, Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import logging

from src.models.question import Question, QuestionType
from src.models.student_exam import StudentExam, ExamStatus
from src.models.student_answer import StudentAnswer

logger = logging.getLogger(__name__)


def grade_single_choice(answer_value: dict, correct_answers: List[str], max_score: int = 1) -> Tuple[bool, float]:
    """Grade a single choice question.

    Returns (is_correct, score). Comparison is case-insensitive. Empty answers or missing answer -> incorrect.
    Extracts option letter from answers like "B: Mars" to compare with correct answer "B".
    """
    try:
        if not correct_answers or len(correct_answers) == 0:
            logger.warning("Single choice question has no correct answers configured")
            return False, 0.0

        # student answer format: {"answer": "A"} or {"answer": "A: Option Text"}
        student_answer = None
        if isinstance(answer_value, dict):
            student_answer = answer_value.get("answer")

        if not student_answer or not isinstance(student_answer, str):
            return False, 0.0

        # Extract option letter (handle formats like "B: Mars" or just "B")
        student_option = str(student_answer).strip()
        if ":" in student_option:
            # Extract just the letter before the colon
            student_option = student_option.split(":")[0].strip()

        # Extract option letter from correct answer if needed
        expected_option = str(correct_answers[0]).strip()
        if ":" in expected_option:
            expected_option = expected_option.split(":")[0].strip()

        # Case-insensitive comparison of option letters
        is_correct = student_option.lower() == expected_option.lower()
        score = float(max_score) if is_correct else 0.0
        return is_correct, score
    except Exception as e:
        logger.exception("Error grading single_choice: %s", e)
        return False, 0.0


def grade_multi_choice(answer_value: dict, correct_answers: List[str], max_score: int) -> Tuple[bool, float]:
    """Grade a multi choice question.

    Uses strict grading: must exactly match the set of correct answers. Any incorrect selection -> 0.
    Extracts option letters from answers like "B: Mars" to compare with correct answers like "B".
    """
    try:
        if not correct_answers:
            logger.warning("Multi choice question has no correct answers configured")
            return False, 0.0

        # student answers format: {"answers": ["A","B"]} or {"answers": ["A: Option1", "B: Option2"]}
        student_answers = []
        if isinstance(answer_value, dict):
            student_answers = answer_value.get("answers") or []

        if not student_answers or not isinstance(student_answers, list):
            return False, 0.0

        # Extract option letters from student answers (handle "B: Mars" format)
        student_options = []
        for ans in student_answers:
            ans_str = str(ans).strip()
            if ":" in ans_str:
                # Extract just the letter before the colon
                student_options.append(ans_str.split(":")[0].strip())
            else:
                student_options.append(ans_str)

        # Extract option letters from correct answers if needed
        expected_options = []
        for ans in correct_answers:
            ans_str = str(ans).strip()
            if ":" in ans_str:
                expected_options.append(ans_str.split(":")[0].strip())
            else:
                expected_options.append(ans_str)

        # Case-insensitive set comparison
        expected_set = {opt.lower() for opt in expected_options}
        actual_set = {opt.lower() for opt in student_options}

        is_correct = expected_set == actual_set
        score = float(max_score) if is_correct else 0.0
        return is_correct, score
    except Exception as e:
        logger.exception("Error grading multi_choice: %s", e)
        return False, 0.0


def grade_question(question: Question, answer_value: Optional[dict]) -> Tuple[Optional[bool], Optional[float]]:
    """Route grading for one question based on type.

    Returns (is_correct, score) where None means requires manual grading.
    """
    try:
        qtype = getattr(question, "type", None)
        correct_answers = getattr(question, "correct_answers", None) or []
        max_score = getattr(question, "max_score", 1)

        if qtype == "single_choice":
            return grade_single_choice(answer_value or {}, correct_answers, max_score)
        if qtype == "multi_choice":
            return grade_multi_choice(answer_value or {}, correct_answers, max_score)
        # text and image upload are manual
        if qtype in ("text", "image_upload"):
            return None, None

        # Unknown type: do not grade
        logger.warning("Unknown question type during grading: %s", qtype)
        return None, None
    except Exception as e:
        logger.exception("Error grading question %s: %s", getattr(question, "id", "?"), e)
        # On error return (False, 0) to avoid accidentally awarding points
        return False, 0.0


def _load_exam_questions(db: Session, student_exam: StudentExam):
    """Return ordered questions for an exam using joined load to prevent N+1 queries."""
    # Access via relationship on exam
    exam = student_exam.exam
    if not exam:
        exam = db.query(student_exam.__class__).filter(student_exam.__class__.id == student_exam.id).first().exam
    # return list of Question objects ordered
    return [eq.question for eq in sorted(exam.exam_questions, key=lambda x: x.order_index)]


def grade_student_exam(db: Session, student_exam_id: UUID) -> float:
    """Grade an entire student exam and update StudentAnswer and StudentExam.total_score.

    Returns new total_score (float).
    """
    total = 0.0
    try:
        se = db.query(StudentExam).filter(StudentExam.id == student_exam_id).first()
        if not se:
            raise ValueError("StudentExam not found")

        if se.status not in (ExamStatus.SUBMITTED, ExamStatus.EXPIRED):
            raise ValueError("Exam must be submitted or expired to grade")

        # prefetch questions to avoid N+1
        questions = _load_exam_questions(db, se)

        # fetch student answers
        answers = db.query(StudentAnswer).filter(StudentAnswer.student_exam_id == student_exam_id).all()
        answers_map = {a.question_id: a for a in answers}

        graded_count = 0
        pending_review = 0
        for q in questions:
            sa = answers_map.get(q.id)
            # grade only objective questions if answer present, else treat empty
            if q.type in ("single_choice", "multi_choice"):
                av = sa.answer_value if sa else {}
                is_correct, score = grade_question(q, av)
                if sa:
                    sa.is_correct = is_correct
                    sa.score = float(score)
                else:
                    # create a blank StudentAnswer to record an empty answer and 0 score
                    new = StudentAnswer(student_exam_id=student_exam_id, question_id=q.id, answer_value={}, is_correct=is_correct, score=float(score))
                    db.add(new)

                if score:
                    total += float(score)
                graded_count += 1

            else:
                # manual review required. If the answer already has a manual score
                # assigned (e.g., by an admin), keep it and count it towards the
                # total; otherwise mark it pending review.
                if sa:
                    if sa.score is not None:
                        # Respect manual grading score (already stored)
                        total += float(sa.score)
                    else:
                        sa.is_correct = None
                        sa.score = None
                        pending_review += 1
                else:
                    pending_review += 1

        # update student exam totals
        se.total_score = total
        db.commit()
        db.refresh(se)
        logger.info("Graded student exam %s, total_score=%s, graded_count=%s, pending=%s", se.id, se.total_score, graded_count, pending_review)
        return float(total)
    except SQLAlchemyError as e:
        logger.exception("DB error during grading: %s", e)
        db.rollback()
        raise
    except Exception as e:
        logger.exception("Error grading exam %s: %s", student_exam_id, e)
        db.rollback()
        raise


def regrade_exam(db: Session, student_exam_id: UUID) -> float:
    """Re-grade exam; reuses grade_student_exam logic.

    Typically called by admin after manual corrections.
    """
    return grade_student_exam(db, student_exam_id)
