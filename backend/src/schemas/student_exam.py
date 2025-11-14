"""
Pydantic schemas for student exam endpoints.

This file includes response and request models used by Student endpoints.
"""
from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from src.schemas.question import QuestionResponse


class AvailableExamResponse(BaseModel):
    """Model for listing exams visible to a student.

    status: one of `available`, `upcoming`, `ended`
    """

    exam_id: UUID = Field(..., description="Exam id")
    title: str = Field(..., description="Exam title")
    description: Optional[str] = Field(None, description="Exam description")
    start_time: datetime = Field(..., description="Exam start time (UTC)")
    end_time: datetime = Field(..., description="Exam end time (UTC)")
    duration_minutes: int = Field(..., description="Duration in minutes")
    status: str = Field(..., description="Availability status: available, upcoming, or ended")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "exam_id": "550e8400-e29b-41d4-a716-446655440000",
            "title": "Algebra Midterm",
            "description": "Covers algebra topics",
            "start_time": "2025-12-01T09:00:00Z",
            "end_time": "2025-12-01T12:00:00Z",
            "duration_minutes": 90,
            "status": "available",
        }
    })


class StudentExamResponse(BaseModel):
    """Response model representing the student's exam session.

    time_remaining_seconds: seconds left before auto-expire
    """

    id: UUID = Field(..., description="StudentExam id")
    exam_id: UUID = Field(..., description="Exam id")
    student_id: UUID = Field(..., description="Student user id")
    started_at: Optional[datetime] = Field(None, description="Timestamp when student started the exam")
    submitted_at: Optional[datetime] = Field(None, description="Timestamp when the student submitted the exam (if any)")
    status: str = Field(..., description="Exam session status: not_started, in_progress, submitted, expired")
    time_remaining_seconds: int = Field(..., description="Number of seconds remaining in the session")

    model_config = ConfigDict(from_attributes=True)


class AnswerSubmission(BaseModel):
    """A student's answer to a single question.

    `answer_value` is free-form JSONB and will be validated by the DB.
    """

    question_id: UUID = Field(..., description="UUID of the question")
    answer_value: dict = Field(..., description="Answer payload (JSON structure)")


class ExamSubmitResponse(BaseModel):
    """Response returned when a student submits an exam."""

    student_exam_id: UUID = Field(..., description="StudentExam id")
    submitted_at: datetime = Field(..., description="Submission timestamp")
    message: str = Field(..., description="Human readable message")


class ExamDetailsLite(BaseModel):
    """Exam details returned along with the student session."""

    title: str
    description: Optional[str]
    duration_minutes: int


class ExamSessionResponse(BaseModel):
    """Full session payload returned when fetching an in-progress session.

    Questions must not include answers and must not include correct answers.
    `answers` is a mapping of question_id -> answer_value (JSONB)
    """

    student_exam: StudentExamResponse
    exam_details: ExamDetailsLite
    questions: List[QuestionResponse] = Field(default_factory=list)
    answers: Dict[UUID, dict] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)
