"""
Student-facing API endpoints for exam participation.
"""
from __future__ import annotations

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timezone

from src.config.database import get_db
from src.utils.dependencies import get_current_student
from src.services import student_exam_service, answer_service
from src.schemas.student_exam import AvailableExamResponse, StudentExamResponse, ExamSessionResponse, AnswerSubmission, ExamSubmitResponse, ExamDetailsLite
from src.schemas.student_exam import GradingResult
from src.models.student_answer import StudentAnswer
from src.schemas.question import QuestionResponse
from src.models.student_exam import ExamStatus

router = APIRouter(prefix="/api/student", tags=["Student Exams"])


def _ensure_aware(dt: datetime | None) -> datetime | None:
    """Convert naive datetimes (SQLite) to UTC-aware for comparisons."""

    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


@router.get("/exams", response_model=List[AvailableExamResponse])
def list_exams(student=Depends(get_current_student), db: Session = Depends(get_db)):
    """List exams available to the authenticated student."""
    exams = student_exam_service.get_available_exams(db, student.id)
    now = datetime.now(timezone.utc)
    result = []
    for e in exams:
        start_time = _ensure_aware(e.start_time)
        end_time = _ensure_aware(e.end_time)
        if not start_time or not end_time:
            continue

        if now < start_time:
            status = "upcoming"
        elif start_time <= now <= end_time:
            status = "available"
        else:
            status = "ended"

        result.append(AvailableExamResponse(
            exam_id=e.id,
            title=e.title,
            description=e.description,
            start_time=e.start_time,
            end_time=e.end_time,
            duration_minutes=e.duration_minutes,
            status=status,
        ))

    return result


@router.post("/exams/{exam_id}/start", response_model=StudentExamResponse)
def start_exam(exam_id: UUID, student=Depends(get_current_student), db: Session = Depends(get_db), response: Response = None):
    """Start an exam for the student. Returns 201 when created new, 200 on resume."""
    try:
        se = student_exam_service.start_exam(db, exam_id, student.id)
        status_code = status.HTTP_200_OK if getattr(se, "_resumed", False) else status.HTTP_201_CREATED

        # Build a plain dict to avoid nested attribute types from model validation
        student_exam_payload = {
            "id": se.id,
            "exam_id": se.exam_id,
            "student_id": se.student_id,
            "started_at": se.started_at,
            "submitted_at": se.submitted_at,
            "status": se.status.value if hasattr(se.status, "value") else str(se.status),
            "time_remaining_seconds": 0,
        }

        if response is not None:
            response.status_code = status_code

        return StudentExamResponse.model_validate(student_exam_payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")


@router.get("/exams/{student_exam_id}", response_model=ExamSessionResponse, response_model_exclude_none=True)
def get_exam_session(student_exam_id: UUID, student=Depends(get_current_student), db: Session = Depends(get_db)):
    """Get an exam session for the authenticated student (resume or during exam)."""
    try:
        data = student_exam_service.get_exam_session(db, student_exam_id, student.id)

        if data.get("expired"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exam time expired")

        se = data["student_exam"]
        exam = data["exam"]
        questions = data["questions"]
        answers = data["answers"]
        time_remaining = data["time_remaining"]

        # Ensure questions do not include the correct_answers field for students
        # We remove the key and also use response_model_exclude_none to avoid a null value
        q_responses = []
        for q in questions:
            q_obj = QuestionResponse.model_validate(q).model_dump()
            if "correct_answers" in q_obj:
                q_obj.pop("correct_answers")
            q_responses.append(q_obj)

        return ExamSessionResponse(
            student_exam=StudentExamResponse(
                id=se.id,
                exam_id=se.exam_id,
                student_id=se.student_id,
                started_at=se.started_at,
                submitted_at=se.submitted_at,
                status=se.status.value if hasattr(se.status, "value") else se.status,
                time_remaining_seconds=time_remaining,
            ),
            exam_details=ExamDetailsLite(title=exam.title, description=exam.description, duration_minutes=exam.duration_minutes),
            questions=q_responses,
            answers=answers,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.put("/exams/{student_exam_id}/answer")
def save_answer(student_exam_id: UUID, answer: AnswerSubmission, student=Depends(get_current_student), db: Session = Depends(get_db)):
    """Save a single answer (auto-save feature). Optimized for quick responses."""
    try:
        success = student_exam_service.save_answer(db, student_exam_id, student.id, answer)
        return {"success": success, "saved_at": datetime.now(timezone.utc)}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.post("/exams/{student_exam_id}/submit", response_model=ExamSubmitResponse)
def submit_exam(student_exam_id: UUID, student=Depends(get_current_student), db: Session = Depends(get_db)):
    """Submit the student's exam. Validates ownership and status."""
    try:
        se = student_exam_service.submit_exam(db, student_exam_id, student.id)

        # Compute grading counts and per-question grading results
        graded_count = db.query(StudentAnswer).filter(StudentAnswer.student_exam_id == se.id, StudentAnswer.score != None).count()
        pending_review_count = db.query(StudentAnswer).filter(StudentAnswer.student_exam_id == se.id, StudentAnswer.score == None).count()

        # Build per-question grading results
        grading_rows = db.query(StudentAnswer).filter(StudentAnswer.student_exam_id == se.id).all()
        grading_results = []
        for r in grading_rows:
            q = r.question
            requires_manual = r.score is None
            grading_results.append(GradingResult(
                question_id=r.question_id,
                is_correct=r.is_correct,
                score=r.score,
                max_score=q.max_score if q else 0,
                requires_manual_review=requires_manual,
            ))

        return ExamSubmitResponse(
            student_exam_id=se.id,
            submitted_at=se.submitted_at,
            message="Submitted successfully",
            total_score=getattr(se, "total_score", None),
            graded_count=graded_count,
            pending_review_count=pending_review_count,
            grading_results=grading_results,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
