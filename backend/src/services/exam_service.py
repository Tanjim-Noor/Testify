"""
Exam service: business logic for managing exams, question assignments and publishing.
"""
from __future__ import annotations

from typing import Dict, List, Optional, Any, cast
from uuid import UUID
import logging

from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError

from src.models.exam import Exam
from src.models.question import Question
from src.models.exam_question import ExamQuestion
from src.models.student_exam import StudentExam

from src.schemas.exam import ExamCreate, ExamUpdate, ExamQuestionAssignment

logger = logging.getLogger(__name__)


def create_exam(db: Session, exam_data: ExamCreate, admin_id: UUID) -> Exam:
    """
    Create new exam in the database with validations.

    - Validates time window constraints
    - Sets created_by to admin_id and is_published False by default
    - Returns the created Exam instance
    """
    try:
        data = exam_data.model_dump()

        # Time validations are performed by Pydantic, re-check to be defensive
        start = data["start_time"]
        end = data["end_time"]
        if end <= start:
            raise ValueError("end_time must be after start_time")

        new_exam = Exam(
            title=data["title"],
            description=data.get("description"),
            start_time=data["start_time"],
            end_time=data["end_time"],
            duration_minutes=data["duration_minutes"],
            is_published=False,
            created_by=admin_id,
        )

        db.add(new_exam)
        db.commit()
        db.refresh(new_exam)
        return new_exam
    except SQLAlchemyError as e:
        logger.exception("DB error while creating exam: %s", e)
        db.rollback()
        raise


def get_exams(db: Session, filters: Optional[Dict] = None) -> List[Exam]:
    """Return list of exams applying optional filters.

    - `filters` can include `is_published` boolean.
    - Eager-loads creator information and uses descending created_at order.
    """
    try:
        query = db.query(Exam).options(joinedload(Exam.creator))

        if filters and "is_published" in filters:
            query = query.filter(Exam.is_published == filters["is_published"])  # type: ignore[attr-defined]

        exams = query.order_by(Exam.created_at.desc()).all()
        return exams
    except SQLAlchemyError as e:
        logger.exception("DB error while listing exams: %s", e)
        db.rollback()
        raise


def get_exam_by_id(db: Session, exam_id: UUID) -> Optional[Exam]:
    """Retrieve an exam by id, including associated questions and creator."""
    try:
        exam = (
            db.query(Exam)
            .options(joinedload(Exam.creator), joinedload(Exam.exam_questions).joinedload(ExamQuestion.question))
            .filter(Exam.id == exam_id)
            .first()
        )
        return exam
    except SQLAlchemyError as e:
        logger.exception("DB error while getting exam: %s", e)
        db.rollback()
        raise


def update_exam(db: Session, exam_id: UUID, exam_data: ExamUpdate) -> Optional[Exam]:
    """Update exam fields. Only allowed when exam is not published OR has no submissions.

    Returns updated exam or None if exam does not exist.
    Raises ValueError when update isn't allowed.
    """
    try:
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        if not exam:
            return None

        # If the exam is published, ensure there are no student submissions
        # SQLAlchemy's Column descriptors are statically typed as Column[bool]
        # (Pylance may complain). Cast to bool to satisfy the type checker.
        if cast(bool, exam.is_published):
            submissions = db.query(StudentExam).filter(StudentExam.exam_id == exam_id).count()
            if submissions > 0:
                raise ValueError("Cannot update exam after students started; exam is locked")

        data = exam_data.model_dump(exclude_none=True)
        if not data:
            return exam

        # Ensure end_time > start_time if both are being updated
        if "start_time" in data and "end_time" in data and data["end_time"] <= data["start_time"]:
            raise ValueError("end_time must be after start_time")

        for key, val in data.items():
            setattr(exam, key, val)

        db.commit()
        db.refresh(exam)
        return exam
    except SQLAlchemyError as e:
        logger.exception("DB error while updating exam: %s", e)
        db.rollback()
        raise


def delete_exam(db: Session, exam_id: UUID) -> bool:
    """Delete an exam if no student submissions exist.

    Returns True on success, False when exam not found.
    Raises ValueError if there are submissions present.
    """
    try:
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        if not exam:
            return False

        submissions = db.query(StudentExam).filter(StudentExam.exam_id == exam_id).count()
        if submissions > 0:
            raise ValueError("Cannot delete exam with student submissions")

        db.delete(exam)
        db.commit()
        return True
    except SQLAlchemyError as e:
        logger.exception("DB error while deleting exam: %s", e)
        db.rollback()
        raise


def assign_questions(db: Session, exam_id: UUID, question_assignments: List[ExamQuestionAssignment]) -> Exam:
    """Assign a list of questions to an exam with specified order indices.

    - Validates all question IDs exist
    - Removes existing assignments for the exam and replaces with new set
    """
    try:
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        if not exam:
            raise ValueError("Exam not found")

        # Validate question IDs
        qids = [a.question_id for a in question_assignments]
        unique_qids = list(set(qids))

        existing_questions = db.query(Question).filter(Question.id.in_(unique_qids)).all()
        # Convert SQLAlchemy column-typed ids to raw UUIDs for set math and typing
        existing_ids = {cast(UUID, q.id) for q in existing_questions}
        if len(existing_questions) != len(unique_qids):
            missing = set(unique_qids) - existing_ids
            raise ValueError(f"Some questions were not found: {missing}")

        # Delete existing assignments
        db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam_id).delete(synchronize_session=False)

        # Create new assignments
        objects = []
        for a in question_assignments:
            obj = ExamQuestion(exam_id=exam_id, question_id=a.question_id, order_index=a.order_index)
            objects.append(obj)

        db.bulk_save_objects(objects)
        db.commit()
        db.refresh(exam)
        return exam
    except SQLAlchemyError as e:
        logger.exception("DB error while assigning questions: %s", e)
        db.rollback()
        raise


def reorder_questions(db: Session, exam_id: UUID, question_order: List[UUID]) -> bool:
    """Reorder questions for an exam by updating order_index values.

    - Ensures that the set of IDs matches current assignment set
    - Returns True on success
    """
    try:
        # Fetch existing assignments
        existing = db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam_id).all()
        if not existing:
            raise ValueError("No questions assigned to this exam")

        existing_ids = {cast(UUID, e.question_id) for e in existing}
        # Ensure same set of ids
        if set(question_order) != existing_ids:
            raise ValueError("Question order does not match assigned questions")

        # Map id -> object for quick update
        id_map = {cast(UUID, e.question_id): e for e in existing}

        for idx, qid in enumerate(question_order):
            obj = id_map[qid]
            # `order_index` is typed as Column[int]; silence type-checker using `cast(Any, ...)`
            cast(Any, obj).order_index = idx

        db.commit()
        return True
    except SQLAlchemyError as e:
        logger.exception("DB error while reordering questions: %s", e)
        db.rollback()
        raise


def publish_exam(db: Session, exam_id: UUID, is_published: bool) -> Optional[Exam]:
    """Publish or unpublish an exam.

    When publishing, ensures that there is at least one question assigned.
    """
    try:
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        if not exam:
            return None

        if is_published:
            count = db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam_id).count()
            if count == 0:
                raise ValueError("Cannot publish exam without assigned questions")

        # assign attribute via setattr or cast to `Any` to avoid Pylance Column[bool] errors
        cast(Any, exam).is_published = is_published
        db.commit()
        db.refresh(exam)
        return exam
    except SQLAlchemyError as e:
        logger.exception("DB error while publishing exam: %s", e)
        db.rollback()
        raise
