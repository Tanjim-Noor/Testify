from __future__ import annotations

from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.utils.dependencies import get_current_student
from src.services import results_service
from src.schemas.result import StudentResultResponse
from src.models.student_exam import StudentExam

router = APIRouter(prefix="/api/student/results", tags=["Results"]) 


@router.get("/{student_exam_id}", response_model=StudentResultResponse)
def get_student_result(student_exam_id: UUID = Path(...), student=Depends(get_current_student), db: Session = Depends(get_db)):
    """Get student's result for a specific student exam id.

    - Student may only fetch their own result
    - Correct answers are only shown after submission
    """
    try:
        data = results_service.get_student_result(db, student_exam_id, student.id)
        return StudentResultResponse.model_validate(data)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="StudentExam not found")
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/exam/{exam_id}", response_model=StudentResultResponse)
def get_student_result_by_exam(exam_id: UUID = Path(...), student=Depends(get_current_student), db: Session = Depends(get_db)):
    """Get the student's result for a given exam id.

    - Looks up the StudentExam by exam_id and current user.
    - Returns 404 if student hasn't taken the exam.
    """
    se = db.query(StudentExam).filter(StudentExam.exam_id == exam_id, StudentExam.student_id == student.id).first()
    if not se:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="StudentExam not found for this exam and student")
    try:
        data = results_service.get_student_result(db, se.id, student.id)
        return StudentResultResponse.model_validate(data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
