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
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from src.config.settings import settings
from src.services import question_service
from src.utils.file_handler import save_upload_file, validate_excel_file
from src.utils.dependencies import get_current_admin
from src.config.database import get_db
from src.schemas.question import ImportResult

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
