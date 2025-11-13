"""
Question service implementations for bulk creation and Excel import orchestration.
"""
from __future__ import annotations

import logging
from typing import List

from sqlalchemy.orm import Session

from src.models.question import Question
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
