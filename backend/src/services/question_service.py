"""
Question service implementations for bulk creation and Excel import orchestration.
"""
from __future__ import annotations

import logging
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError

from sqlalchemy.orm import Session

from src.models.question import Question
from src.schemas.question import QuestionFilter, PaginationParams, QuestionCreate
from src.services.excel_parser import QuestionExcelParser
from src.schemas.question import ImportResult, ImportRowError

logger = logging.getLogger(__name__)


def bulk_create_questions(questions_data: List[dict], db: Session) -> int:
    """Bulk insert questions into the database.

    Uses db.bulk_save_objects for performance.

    Returns:
        Number of created questions
    """
    if not questions_data:
        return 0

    try:
        objects = []
        for q in questions_data:
            obj = Question(
                title=q.get("title"),
                description=q.get("description"),
                complexity=q.get("complexity"),
                type=q.get("type"),
                options=q.get("options"),
                correct_answers=q.get("correct_answers") or [],
                max_score=q.get("max_score") or 1,
                tags=q.get("tags"),
            )
            objects.append(obj)

        db.bulk_save_objects(objects)
        db.commit()
        logger.info("Inserted %s questions", len(objects))
        return len(objects)
    except Exception as e:
        logger.exception("Failed to bulk insert questions: %s", e)
        db.rollback()
        raise


def process_excel_import(file_path: str, db: Session) -> ImportResult:
    """Orchestrate import of questions from an Excel file and return ImportResult.

    Steps:
    - Parse file using QuestionExcelParser
    - Bulk insert valid question data
    - Return a summary of successes and per-row errors
    """
    parser = QuestionExcelParser(file_path)
    try:
        valid_rows, errors = parser.parse()
    except Exception as e:
        logger.exception("Error parsing Excel file: %s", e)
        # If parsing fails entirely, add an overall error
        return ImportResult(success_count=0, error_count=1, errors=[ImportRowError(row_number=0, errors=[str(e)])])

    created_count = 0
    if valid_rows:
        try:
            created_count = bulk_create_questions(valid_rows, db)
        except Exception as e:
            # DB insertion failed; log and return an import result with an error
            logger.exception("Error while saving questions to DB: %s", e)
            return ImportResult(success_count=0, error_count=len(valid_rows) + len(errors), errors=errors + [ImportRowError(row_number=0, errors=[str(e)])])

    return ImportResult(success_count=created_count, error_count=len(errors), errors=errors)


def get_questions(db: Session, filters: QuestionFilter, pagination: PaginationParams) -> Tuple[List[Question], int]:
    """Return a list of questions applying filters and pagination.

    Performs case-insensitive search on title and description, supports
    complexity and type filters, and tags using Postgres array overlap.

    Args:
        db: SQLAlchemy session
        filters: QuestionFilter with optional filters
        pagination: PaginationParams specifying page and limit

    Returns:
        Tuple[list[Question], int] -> (questions, total_count)
    """
    try:
        query = db.query(Question)

        # Apply filters
        if filters.complexity:
            query = query.filter(Question.complexity == filters.complexity)

        if filters.type:
            query = query.filter(Question.type == filters.type)

        if filters.tags:
            query = query.filter(Question.tags.op('&&')(filters.tags))

        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(Question.title.ilike(search_term), Question.description.ilike(search_term))
            )

        # Total count before pagination
        total = query.count()

        # Apply ordering and pagination
        offset = (pagination.page - 1) * pagination.limit
        questions = query.order_by(Question.created_at.desc()).offset(offset).limit(pagination.limit).all()

        return questions, total
    except SQLAlchemyError as e:
        logger.exception("DB error while querying questions: %s", e)
        db.rollback()
        raise


def get_question_by_id(db: Session, question_id: UUID) -> Optional[Question]:
    """Retrieve a single question by UUID.

    Returns None when not found.
    """
    try:
        return db.query(Question).filter(Question.id == question_id).first()
    except SQLAlchemyError as e:
        logger.exception("DB error while getting question by id: %s", e)
        db.rollback()
        raise


def create_question(db: Session, question_data: QuestionCreate) -> Question:
    """Create a new question record from schema data.

    Returns the created Question with generated fields populated.
    """
    try:
        data = question_data.model_dump()
        obj = Question(
            title=data.get("title"),
            description=data.get("description"),
            complexity=data.get("complexity"),
            type=data.get("type"),
            options=data.get("options"),
            correct_answers=data.get("correct_answers") or [],
            max_score=data.get("max_score") or 1,
            tags=data.get("tags"),
        )
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj
    except SQLAlchemyError as e:
        logger.exception("DB error while creating question: %s", e)
        db.rollback()
        raise


def update_question(db: Session, question_id: UUID, question_data: QuestionCreate) -> Optional[Question]:
    """Update an existing question with provided data.

    Returns updated question or None if not found.
    """
    try:
        question = db.query(Question).filter(Question.id == question_id).first()
        if not question:
            return None

        data = question_data.model_dump()
        for key, value in data.items():
            setattr(question, key, value)

        db.commit()
        db.refresh(question)
        return question
    except SQLAlchemyError as e:
        logger.exception("DB error while updating question: %s", e)
        db.rollback()
        raise


def delete_question(db: Session, question_id: UUID) -> bool:
    """Delete a question by id; returns True if deleted, False if not found."""
    try:
        question = db.query(Question).filter(Question.id == question_id).first()
        if not question:
            return False
        db.delete(question)
        db.commit()
        return True
    except SQLAlchemyError as e:
        logger.exception("DB error while deleting question: %s", e)
        db.rollback()
        raise
