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
    submission_status: one of `not_started`, `in_progress`, `submitted` (optional)
    """

    exam_id: UUID = Field(..., description="Exam id")
    title: str = Field(..., description="Exam title")
    description: Optional[str] = Field(None, description="Exam description")
    start_time: datetime = Field(..., description="Exam start time (UTC)")
    end_time: datetime = Field(..., description="Exam end time (UTC)")
    duration_minutes: int = Field(..., description="Duration in minutes")
    status: str = Field(..., description="Availability status: available, upcoming, or ended")
    student_exam_id: Optional[UUID] = Field(None, description="Student exam session ID if started")
    submission_status: Optional[str] = Field(None, description="Submission status: not_started, in_progress, or submitted")

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
    total_score: Optional[float] = Field(None, description="Total score calculated for objective questions")
    graded_count: int = Field(0, description="Number of questions automatically graded")
    pending_review_count: int = Field(0, description="Number of questions requiring manual review")
    grading_results: List[GradingResult] = Field(default_factory=list, description="Per-question grading results")


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


class GradingResult(BaseModel):
    question_id: UUID = Field(..., description="Question id")
    is_correct: Optional[bool] = Field(None, description="Whether the answer was correct (None if manual review)")
    score: Optional[float] = Field(None, description="Score awarded for this question (None if pending review)")
    max_score: int = Field(..., description="Maximum score for the question")
    requires_manual_review: bool = Field(False, description="True if grading requires manual review")


class ManualGradeRequest(BaseModel):
    score: float = Field(..., description="Score to assign to this answer")
    feedback: Optional[str] = Field(None, description="Optional feedback from grader")

