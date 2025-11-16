"""
Pydantic schemas for results and score endpoints.

Defines student and admin-facing result response models including
per-question breakdowns and exam-level summaries.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class QuestionResultResponse(BaseModel):
    """Detailed per-question result shown in a student's result view.

    - `student_answer` is the raw JSONB the student submitted
    - `correct_answer` is only exposed to students after submission; admins always see it
    - `requires_manual_review` is True when grading is pending
    """

    question_id: UUID = Field(..., description="UUID of the question")
    answer_id: Optional[UUID] = Field(None, description="UUID of the student answer; null if not answered")
    title: str = Field(..., description="Question title")
    type: str = Field(..., description="Question type: single_choice, multi_choice, text, image_upload")
    student_answer: Optional[dict] = Field(None, description="The student's submitted answer (JSON)")
    correct_answer: Optional[list] = Field(None, description="Correct answers for objective questions; null for manual types or when hidden")
    is_correct: Optional[bool] = Field(None, description="True if the answer is correct; null if manual review pending or hidden")
    score: Optional[float] = Field(None, description="Score awarded to this question; null if pending manual grading")
    max_score: int = Field(..., description="Maximum possible score for question")
    requires_manual_review: bool = Field(False, description="Whether this question requires manual grading")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "question_id": "550e8400-e29b-41d4-a716-446655441111",
            "answer_id": "550e8400-e29b-41d4-a716-446655442222",
            "title": "What is 2+2?",
            "type": "single_choice",
            "student_answer": {"answer": "A"},
            "correct_answer": ["B"],
            "is_correct": False,
            "score": 0.0,
            "max_score": 1,
            "requires_manual_review": False,
        }
    })


class StudentResultResponse(BaseModel):
    """Student-facing high level result for a completed exam.

    Students can only see correct answers once they have submitted the exam.
    """

    student_exam_id: UUID = Field(..., description="StudentExam id")
    exam_title: str = Field(..., description="Exam title")
    student_name: str = Field(..., description="Student name (for convenience)")
    student_email: str = Field(..., description="Student email")
    total_score: Optional[float] = Field(None, description="Total points earned for this exam")
    max_possible_score: float = Field(..., description="Maximum achievable score for the exam")
    percentage: Optional[float] = Field(None, description="Percentage score (0-100), rounded to 2 decimals")
    submitted_at: Optional[datetime] = Field(None, description="Submission timestamp; null if not submitted")
    status: str = Field(..., description="Status of the student exam: not_started/in_progress/submitted/expired")
    question_results: List[QuestionResultResponse] = Field(default_factory=list, description="Per-question breakdown")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "student_exam_id": "550e8400-e29b-41d4-a716-446655442222",
            "exam_title": "Algebra Midterm",
            "student_name": "Jane Doe",
            "student_email": "jane@example.com",
            "total_score": 8.0,
            "max_possible_score": 10.0,
            "percentage": 80.0,
            "submitted_at": "2025-12-01T10:00:00Z",
            "status": "submitted",
            "question_results": [],
        }
    })


class ExamResultsSummary(BaseModel):
    """Aggregate statistics for an exam used in the admin dashboard.

    Average, highest and lowest scores are computed across submitted exams.
    """

    exam_id: UUID = Field(..., description="Exam id")
    exam_title: str = Field(..., description="Exam title")
    total_students: int = Field(..., description="Total students who have a StudentExam record for this exam")
    average_score: Optional[float] = Field(None, description="Average score across submitted exams")
    highest_score: Optional[float] = Field(None, description="Highest score across submitted exams")
    lowest_score: Optional[float] = Field(None, description="Lowest score across submitted exams")
    submission_count: int = Field(..., description="Number of students who submitted the exam")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "exam_id": "550e8400-e29b-41d4-a716-446655443333",
            "exam_title": "Algebra Midterm",
            "total_students": 30,
            "average_score": 6.23,
            "highest_score": 10.0,
            "lowest_score": 2.0,
            "submission_count": 28,
        }
    })


class StudentResultSummary(BaseModel):
    """Summarized result for a single student in admin exam listing."""

    student_exam_id: UUID = Field(..., description="StudentExam id (needed to view detailed results)")
    student_id: UUID = Field(..., description="Student user id")
    student_name: str = Field(..., description="Student's name")
    student_email: str = Field(..., description="Student's email")
    total_score: Optional[float] = Field(None, description="Total earned points for the exam")
    percentage: Optional[float] = Field(None, description="Percentage score")
    submitted_at: Optional[datetime] = Field(None, description="Submission time")
    status: str = Field(..., description="Status of the StudentExam")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "student_exam_id": "550e8400-e29b-41d4-a716-446655445555",
            "student_id": "550e8400-e29b-41d4-a716-446655444444",
            "student_name": "John Doe",
            "student_email": "john@example.com",
            "total_score": 7.0,
            "percentage": 70.0,
            "submitted_at": "2025-12-01T11:00:00Z",
            "status": "submitted",
        }
    })


class AdminExamResultsResponse(BaseModel):
    """Admin-facing response with exam-level statistics and per-student summaries."""

    exam_summary: ExamResultsSummary = Field(..., description="Aggregate exam summary")
    student_results: List[StudentResultSummary] = Field(default_factory=list, description="List of student result summaries")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "exam_summary": {},
            "student_results": []
        }
    })
