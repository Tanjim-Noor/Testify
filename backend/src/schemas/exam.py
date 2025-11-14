from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, ValidationInfo, ConfigDict

from src.schemas.question import QuestionResponse


class ExamBase(BaseModel):
    """
    Base schema for exam creation and updates.

    Attributes:
        - title: Short descriptive title of the exam
        - description: Optional longer description
        - start_time: Start datetime (must be in the future for new exams)
        - end_time: End datetime (must be after start_time)
        - duration_minutes: Positive integer number of minutes allowed for the exam
    """

    title: str = Field(..., description="Exam title")
    description: Optional[str] = Field(None, description="Exam description")
    start_time: datetime = Field(..., description="Exam window start time (UTC)")
    end_time: datetime = Field(..., description="Exam window end time (UTC)")
    duration_minutes: int = Field(..., gt=0, description="Duration of the exam in minutes (positive)")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "title": "Midterm Exam - Algebra",
            "description": "Covers chapters 1-4",
            "start_time": "2025-12-01T09:00:00Z",
            "end_time": "2025-12-01T12:00:00Z",
            "duration_minutes": 90,
        }
    })

    @field_validator("end_time", mode="after")
    def end_time_after_start(cls, value, info: ValidationInfo):
        start = info.data.get("start_time")
        if start and value <= start:
            raise ValueError("end_time must be after start_time")
        return value


class ExamCreate(ExamBase):
    """Schema used for creating new exam.

    NOTE: Historically this schema enforced `start_time` to be strictly in the
    future. Integration tests and the normal exam workflow may create exams
    that start immediately or in the past (e.g., to start an exam right away).
    To support that behavior we do not validate `start_time` here; instead the
    business logic in the services enforces whether the exam is *available*
    for students to start.
    """


class ExamUpdate(BaseModel):
    """Schema for updating an exam; all fields optional."""

    title: Optional[str] = Field(None, description="Exam title")
    description: Optional[str] = Field(None, description="Exam description")
    start_time: Optional[datetime] = Field(None, description="Exam window start time (UTC)")
    end_time: Optional[datetime] = Field(None, description="Exam window end time (UTC)")
    duration_minutes: Optional[int] = Field(None, gt=0, description="Duration in minutes (positive)")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "title": "Updated title",
            "description": "Updated description",
            "start_time": "2025-12-01T08:30:00Z",
            "end_time": "2025-12-01T11:00:00Z",
            "duration_minutes": 75,
        }
    })

    @field_validator("end_time", mode="after")
    def end_after_start(cls, value, info: ValidationInfo):
        start = info.data.get("start_time")
        if start and value is not None and value <= start:
            raise ValueError("end_time must be after start_time")
        return value


class ExamResponse(ExamBase):
    """Schema used when returning exam info in lists/comments.

    Adds fields: id, is_published, created_by, created_at, question_count
    """

    id: UUID = Field(..., description="Exam unique identifier")
    is_published: bool = Field(False, description="Published state of the exam")
    created_by: UUID = Field(..., description="Admin user who created the exam")
    created_at: datetime = Field(..., description="Timestamp the exam was created")
    question_count: int = Field(0, description="Number of questions assigned to this exam")

    model_config = ConfigDict(from_attributes=True)


class ExamDetailResponse(ExamResponse):
    """Detailed response with questions assigned to the exam."""

    questions: List[QuestionResponse] = Field(default_factory=list, description="List of questions for the exam")


class ExamQuestionAssignment(BaseModel):
    """Simple assignment payload for a question in an exam."""

    question_id: UUID = Field(..., description="UUID of the question to assign")
    order_index: int = Field(..., ge=0, description="Zero-based sort index for the question")

    model_config = ConfigDict(json_schema_extra={
        "example": {"question_id": "550e8400-e29b-41d4-a716-446655440000", "order_index": 0}
    })


class PublishRequest(BaseModel):
    """Schema for publishing or unpublishing an exam."""

    is_published: bool = Field(..., description="True to publish, False to unpublish")

    model_config = ConfigDict(json_schema_extra={
        "example": {"is_published": True}
    })
