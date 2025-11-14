from __future__ import annotations

from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.utils.dependencies import get_current_admin
from src.services import exam_service
from src.services import grading_service
from src.schemas.exam import (
    ExamCreate,
    ExamResponse,
    ExamDetailResponse,
    ExamUpdate,
    ExamQuestionAssignment,
    PublishRequest,
)
from src.schemas.student_exam import ManualGradeRequest
from datetime import datetime, timezone
from src.models.student_answer import StudentAnswer
from src.schemas.question import QuestionResponse

router = APIRouter(prefix="/api/admin/exams", tags=["Exams"]) 

# Generic admin router for cross-cutting admin endpoints
admin_router = APIRouter(prefix="/api/admin", tags=["Admin"])


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



@admin_router.post("/student-answers/{answer_id}/grade", status_code=status.HTTP_200_OK)
def manual_grade_answer(
    answer_id: UUID = Path(..., description="UUID of the student answer to grade"),
    payload: ManualGradeRequest = None,
    db: Session = Depends(get_db),
    admin_user: Any = Depends(get_current_admin),
):
    """Admin endpoint to manually grade a student's answer.

    - Validates the provided score is within the question's max_score
    - Stores feedback inside `answer_value.grader_feedback`
    - Recalculates StudentExam.total_score after grading
    """
    try:
        ans = db.query(StudentAnswer).filter(StudentAnswer.id == answer_id).first()
        if not ans:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="StudentAnswer not found")

        q = ans.question
        if not q:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question for answer not found")

        if payload.score < 0 or payload.score > q.max_score:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Score must be between 0 and {q.max_score}")

        # Update score and is_correct flag (full marks considered correct)
        ans.score = float(payload.score)
        ans.is_correct = payload.score == q.max_score

        # store feedback in JSONB answer_value for audit
        av = ans.answer_value or {}
        av["grader_feedback"] = payload.feedback
        ans.answer_value = av
        # Audit
        ans.graded_by = admin_user.id
        ans.graded_at = datetime.now(timezone.utc)

        db.commit()

        # Recalculate student exam total
        grading_service.regrade_exam(db, ans.student_exam_id)

        db.refresh(ans)
        return {
            "id": str(ans.id),
            "question_id": str(ans.question_id),
            "score": ans.score,
            "is_correct": ans.is_correct,
        }
    except HTTPException:
        raise
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
