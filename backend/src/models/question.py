"""
Question model for the Online Exam Management System.

This module defines the Question model representing exam questions with various types.
"""

import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from src.config.database import Base


class QuestionType(str, enum.Enum):
    """Enumeration for question types."""
    
    SINGLE_CHOICE = "single_choice"
    MULTI_CHOICE = "multi_choice"
    TEXT = "text"
    IMAGE_UPLOAD = "image_upload"


class Question(Base):
    """
    Question model representing exam questions.
    
    Supports multiple question types including single/multi-choice, text, and image uploads.
    Stores options and correct answers in JSONB format for flexibility.
    """
    
    __tablename__ = "questions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    complexity = Column(String, nullable=False, index=True)  # e.g., "Class 1", "Class 2"
    type = Column(String, nullable=False, index=True)  # Using String instead of Enum for flexibility
    options = Column(JSONB, nullable=True)  # For choice-based questions
    correct_answers = Column(JSONB, nullable=False)  # Can be null for text/image
    max_score = Column(Integer, nullable=False, default=1)
    tags = Column(ARRAY(String), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    exam_questions = relationship(
        "ExamQuestion",
        back_populates="question",
        cascade="all, delete-orphan"
    )
    
    student_answers = relationship(
        "StudentAnswer",
        back_populates="question"
    )
    
    def __repr__(self) -> str:
        """String representation of Question instance."""
        return f"<Question(id={self.id}, title={self.title[:30]}..., type={self.type})>"


# Database index for tags using a GIN index for Postgres array overlap performance
from sqlalchemy import Index
Index("ix_questions_tags_gin", Question.tags, postgresql_using="gin")
