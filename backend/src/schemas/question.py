"""
Pydantic schemas for question-related models used in request/response validation.

This module defines schemas for question creation, response and import errors.
"""
from __future__ import annotations

from datetime import datetime
from typing import Generic, List, Literal, Optional, TypeVar, Sequence
from uuid import UUID
from pydantic import BaseModel, Field, constr, conint, ConfigDict
from pydantic import BaseModel


QuestionTypeLiteral = Literal["single_choice", "multi_choice", "text", "image_upload"]


class QuestionBase(BaseModel):
    """Base schema for questions.

    Attributes:
        title: Question title (required, max length 500)
        description: Optional longer description
        complexity: String describing the complexity level
        type: Type of question; one of the allowed literals
        options: For choice-type questions, a list of string options
        correct_answers: For objective questions, a list of correct answers
        max_score: Integer >= 1
        tags: Optional list of string tags
    """

    title: constr(strip_whitespace=True, min_length=1, max_length=500) = Field(..., description="Short title for the question")
    description: Optional[str] = Field(None, description="A more detailed description of the question")
    complexity: str = Field(..., description="Complexity or class level, e.g., 'Class 1' or 'easy', 'medium', 'hard'")
    type: QuestionTypeLiteral = Field(..., description="Type of the question")
    options: Optional[List[str]] = Field(None, description="Options for single/multi choice questions")
    correct_answers: Optional[List[str]] = Field(None, description="Correct answers identifiers")
    max_score: conint(ge=1) = Field(1, description="Maximum score obtainable for the question")
    tags: Optional[List[str]] = Field(None, description="List of tags associated with the question")

    model_config = ConfigDict(json_schema_extra={
            "example": {
                "title": "Simple algebra question",
                "description": "Solve for x in 2x + 3 = 7",
                "complexity": "Class 7",
                "type": "single_choice",
                "options": ["A: 1", "B: 2", "C: 3", "D: 4"],
                "correct_answers": ["B"],
                "max_score": 1,
                "tags": ["math", "algebra"]
            }
        })


class QuestionCreate(QuestionBase):
    """Schema for question creation request. Inherits from QuestionBase."""


class QuestionResponse(QuestionBase):
    """Schema for question response returned by API endpoints.

    Adds id and created_at metadata fields.
    """

    id: UUID = Field(..., description="Unique identifier for the question")
    created_at: datetime = Field(..., description="Creation timestamp")

    model_config = ConfigDict(from_attributes=True)


class ImportRowError(BaseModel):
    """Detailed error information for a single row during import."""

    row_number: int = Field(..., description="Row number within the Excel sheet")
    errors: List[str] = Field(..., description="List of validation or parse errors for the row")


class ImportResult(BaseModel):
    """Import report summarizing results of the bulk import operation."""

    success_count: int = Field(..., description="Number of rows successfully imported")
    error_count: int = Field(..., description="Number of rows that had errors and were skipped")
    errors: List[ImportRowError] = Field(default_factory=list, description="List of per-row errors")

    model_config = ConfigDict(json_schema_extra={
            "example": {
                "success_count": 20,
                "error_count": 2,
                "errors": [
                    {"row_number": 3, "errors": ["Missing title", "Invalid max_score (0)"]},
                    {"row_number": 4, "errors": ["Options required for single_choice type"]}
                ]
            }
        })


# Query/filter and pagination schemas for listing endpoints
T = TypeVar("T")


class QuestionFilter(BaseModel):
    """Query parameters for filtering question lists.

    - complexity: optional filter by the complexity field
    - type: optional filter by question type
    - tags: optional list of tags; any overlapping tag matches
    - search: full-text like search applied to title and description
    """

    complexity: Optional[str] = Field(None, description="Filter by complexity/class level")
    type: Optional[QuestionTypeLiteral] = Field(None, description="Filter by question type")
    tags: Optional[List[str]] = Field(None, description="Filter by one or more tags; questions matching ANY tag returned")
    search: Optional[str] = Field(None, description="Search text to match against title/description (case-insensitive, partial)")


class PaginationParams(BaseModel):
    """Pagination parameters used in list endpoints.

    Validations: page >= 1, limit between 1 and 100
    """

    page: int = Field(1, ge=1, description="Page number (1-based)")
    limit: int = Field(20, ge=1, le=100, description="Page size (max 100)")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper.

    Provides consistent API output format for paginated endpoints.
    """

    data: Sequence[T]
    total: int = Field(..., description="Total number of items available")
    page: int = Field(..., description="Returned page number")
    limit: int = Field(..., description="Returned page size")

