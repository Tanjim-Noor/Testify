"""
Question routes - admin endpoints for managing questions including Excel bulk import.

Expected Excel format (column headers):
    title, description, complexity, type, options, correct_answers, max_score, tags

Notes on fields:
    - options: JSON array string e.g., ["A","B","C"] or CSV
    - correct_answers: JSON array string e.g., ["A"] or ["A","C"] or CSV
    - tags: Comma-separated string e.g., "math,algebra"
"""
from __future__ import annotations

import logging
import os
from typing import Any, List, Optional
from uuid import UUID
from fastapi import Query, Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from src.config.settings import settings
from src.services import question_service
from src.utils.file_handler import save_upload_file, validate_excel_file
from src.utils.dependencies import get_current_admin
from src.config.database import get_db
from src.schemas.question import (
    ImportResult,
    QuestionCreate,
    QuestionResponse,
    QuestionFilter,
    PaginationParams,
    PaginatedResponse,
    QuestionTypeLiteral,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/questions", tags=["Questions"]) 


@router.post("/import", response_model=ImportResult, status_code=status.HTTP_200_OK)
async def import_questions_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_admin),
):
    """Import questions from an Excel file.

    Upload an `.xlsx` file with columns: title, description, complexity, type, options, correct_answers, max_score, tags.
    The endpoint accepts only `.xlsx` files and requires admin authentication.
    """
    # Validate file content and extension
    try:
        validate_excel_file(file)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    uploads_dir = os.path.join(str(settings.BASE_DIR), "uploads")
    file_path = None
    try:
        file_path = await save_upload_file(file, uploads_dir)
        result = question_service.process_excel_import(file_path, db)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unhandled error in import endpoint: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    finally:
        # Clean up temporary file
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                logger.warning("Failed to remove temporary upload: %s", file_path)


@router.get("", response_model=PaginatedResponse[QuestionResponse], status_code=status.HTTP_200_OK)
def list_questions(
    complexity: Optional[str] = Query(None, description="Filter by question complexity"),
    qtype: Optional[QuestionTypeLiteral] = Query(None, description="Filter by question type"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags; can specify multiple tags"),
    search: Optional[str] = Query(None, description="Search title/description (partial matching)"),
    page: int = Query(1, ge=1, description="Page number (default 1)"),
    limit: int = Query(20, ge=1, le=100, description="Page size (1-100, default 20)"),
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_admin),
):
    """List questions with optional filtering and pagination.

    Combines filters using AND logic. Search is case-insensitive and matches
    partial text in the title and description.
    """
    filters = QuestionFilter(complexity=complexity, type=qtype, tags=tags, search=search)
    pagination = PaginationParams(page=page, limit=limit)

    questions, total = question_service.get_questions(db, filters, pagination)

    # Convert SQLAlchemy models into Pydantic response objects to satisfy type
    # checkers and ensure consistent serialization. `from_attributes=True` set
    # on QuestionResponse allows model_validate to read SQLAlchemy objects.
    pyd_questions = [QuestionResponse.model_validate(q) for q in questions]

    return PaginatedResponse[QuestionResponse](data=pyd_questions, total=total, page=page, limit=limit)


@router.get("/{question_id}", response_model=QuestionResponse, status_code=status.HTTP_200_OK)
def get_question(
    question_id: UUID = Path(..., description="UUID of the question"),
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_admin),
):
    """Get a single question by ID."""
    question = question_service.get_question_by_id(db, question_id)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return question


@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def create_question(
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_admin),
):
    """Create a new question."""
    try:
        question = question_service.create_question(db, payload)
        return question
    except Exception as e:
        logger.exception("Failed to create question: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{question_id}", response_model=QuestionResponse, status_code=status.HTTP_200_OK)
def update_question(
    payload: QuestionCreate,
    question_id: UUID = Path(..., description="UUID of the question to update"),
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_admin),
):
    """Update an existing question."""
    updated = question_service.update_question(db, question_id, payload)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return updated


@router.delete("/{question_id}", status_code=status.HTTP_200_OK)
def delete_question(
    question_id: UUID = Path(..., description="UUID of the question to delete"),
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_admin),
):
    """Delete a question by UUID."""
    deleted = question_service.delete_question(db, question_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return {"message": "Question deleted"}
