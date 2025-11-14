"""
Exam model for the Online Exam Management System.

This module defines the Exam model representing exams created by admins.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from src.config.database import Base


class Exam(Base):
    """
    Exam model representing exams in the system.
    
    Exams are created by admin users and contain multiple questions.
    Students can take exams within the specified time window.
    """
    
    __tablename__ = "exams"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    creator = relationship(
        "User",
        back_populates="created_exams",
        foreign_keys=[created_by]
    )
    
    exam_questions = relationship(
        "ExamQuestion",
        back_populates="exam",
        cascade="all, delete-orphan",
        order_by="ExamQuestion.order_index"
    )
    
    student_exams = relationship(
        "StudentExam",
        back_populates="exam",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        """String representation of Exam instance."""
        return f"<Exam(id={self.id}, title={self.title}, is_published={self.is_published})>"

    @property
    def question_count(self) -> int:
        """Return the number of questions assigned to this exam.

        This property is convenient for API responses to include a quick count
        without requiring a separate query. It will rely on the in-memory
        relationship collection and therefore may cause a JOIN to fetch related
        rows if not already loaded.
        """
        return len(self.exam_questions or [])
