from __future__ import annotations

from typing import Any, List, Optional, cast
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.utils.dependencies import get_current_admin
from src.services import results_service
from src.schemas.result import AdminExamResultsResponse, StudentResultResponse
from src.models.student_exam import StudentExam

router = APIRouter(prefix="/api/admin/results", tags=["Admin Results"]) 


@router.get("/exams/{exam_id}", response_model=AdminExamResultsResponse)
def get_exam_results(exam_id: UUID = Path(...), admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    """Get all results for an exam (admin view)"""
    try:
        data = results_service.get_exam_results_for_admin(db, exam_id)
        return AdminExamResultsResponse.model_validate(data)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/student-exams/{student_exam_id}", response_model=StudentResultResponse)
def get_student_exam_detail(student_exam_id: UUID = Path(...), admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    """Get detailed answer review for a student exam (admin only)."""
    try:
        data = results_service.get_student_exam_detail(db, student_exam_id)
        return StudentResultResponse.model_validate(data)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="StudentExam not found")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/exams/{exam_id}/statistics")
def exam_statistics(exam_id: UUID = Path(...), admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    """Return exam statistical summary for admin."""
    try:
        data = results_service.calculate_exam_statistics(db, exam_id)
        return data
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/students/{student_id}/exams")
def get_all_exams_for_student(student_id: UUID = Path(...), admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    """Return list of StudentExam results for a given student (admin only)."""
    try:
        ses = db.query(StudentExam).filter(StudentExam.student_id == student_id).all()
        results: List[dict] = []
        for s in ses:
            # Build compact student result summary
            exam = s.exam
            max_possible = sum([q.question.max_score for q in exam.exam_questions]) if exam and exam.exam_questions else 0
            pct = None
            if s.total_score is not None:
                pct = None
                if s.total_score is not None:
                    pct = round((float(cast(float, s.total_score)) / float(max_possible)) * 100.0, 2) if max_possible > 0 else 0.0

            results.append({
                "student_exam_id": s.id,
                "exam_id": s.exam_id,
                "exam_title": exam.title if exam else None,
                "total_score": s.total_score,
                "max_possible_score": float(max_possible),
                "percentage": pct,
                "submitted_at": s.submitted_at,
                "status": s.status.value if hasattr(s.status, "value") else str(s.status),
            })
        return results
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
