from __future__ import annotations

from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.utils.dependencies import get_current_admin
from src.services import exam_service
from src.schemas.exam import (
    ExamCreate,
    ExamResponse,
    ExamDetailResponse,
    ExamUpdate,
    ExamQuestionAssignment,
    PublishRequest,
)
from src.schemas.question import QuestionResponse

router = APIRouter(prefix="/api/admin/exams", tags=["Exams"]) 


@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(
    payload: ExamCreate,
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_admin),
):
    """Create a new exam (admin only)."""
    try:
        exam = exam_service.create_exam(db, payload, admin_user.id)
        return ExamResponse.model_validate(exam)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("", response_model=List[ExamResponse], status_code=status.HTTP_200_OK)
def list_exams(
    is_published: Optional[bool] = None,
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_admin),
):
    """List exams; allow optional filtering by is_published."""
    try:
        filters = {"is_published": is_published} if is_published is not None else {}
        exams = exam_service.get_exams(db, filters)
        return [ExamResponse.model_validate(e) for e in exams]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{exam_id}", response_model=ExamDetailResponse, status_code=status.HTTP_200_OK)
def get_exam(
    exam_id: UUID = Path(..., description="UUID of the exam"),
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_admin),
):
    """Get detailed exam info including questions."""
    exam = exam_service.get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

    # Compose response: include questions from exam.exam_questions
    questions = [q.question for q in exam.exam_questions]
    resp = ExamDetailResponse.model_validate(exam)
    resp.questions = [QuestionResponse.model_validate(q) for q in questions]
    return resp


@router.put("/{exam_id}", response_model=ExamResponse, status_code=status.HTTP_200_OK)
def update_exam(
    payload: ExamUpdate,
    exam_id: UUID = Path(..., description="UUID of the exam"),
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_admin),
):
    """Update an existing exam. Admin only."""
    try:
        exam = exam_service.update_exam(db, exam_id, payload)
        if not exam:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
        return ExamResponse.model_validate(exam)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/{exam_id}", status_code=status.HTTP_200_OK)
def delete_exam(
    exam_id: UUID = Path(..., description="UUID of the exam to delete"),
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_admin),
):
    """Delete exam if no student submissions are present."""
    try:
        success = exam_service.delete_exam(db, exam_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
        return {"message": "Exam deleted"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/{exam_id}/questions", response_model=ExamDetailResponse, status_code=status.HTTP_200_OK)
def assign_questions(
    payload: List[ExamQuestionAssignment],
    exam_id: UUID = Path(..., description="UUID of the exam"),
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_admin),
):
    """Assign a list of questions to an exam with order indices."""
    try:
        exam = exam_service.assign_questions(db, exam_id, payload)
        # Build detailed response
        questions = [q.question for q in exam.exam_questions]
        resp = ExamDetailResponse.model_validate(exam)
        resp.questions = [QuestionResponse.model_validate(q) for q in questions]
        return resp
    except ValueError as e:
        # Missing question or exam not found -> 404 or 400
        msg = str(e)
        if "not found" in msg.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{exam_id}/questions/reorder", status_code=status.HTTP_200_OK)
def reorder_questions(
    payload: List[UUID],
    exam_id: UUID = Path(..., description="UUID of the exam to reorder questions for"),
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_admin),
):
    """Reorder questions for an exam; payload is a list of question IDs in desired order."""
    try:
        success = exam_service.reorder_questions(db, exam_id, payload)
        return {"message": "Questions reordered"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{exam_id}/publish", response_model=ExamResponse, status_code=status.HTTP_200_OK)
def publish_exam(
    payload: PublishRequest,
    exam_id: UUID = Path(..., description="UUID of the exam to publish/unpublish"),
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_admin),
):
    """Publish or unpublish an exam. Requires at least one question to publish."""
    try:
        exam = exam_service.publish_exam(db, exam_id, payload.is_published)
        if not exam:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
        return ExamResponse.model_validate(exam)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
