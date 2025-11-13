"""
StudentAnswer model for the Online Exam Management System.

This module defines the StudentAnswer model representing a student's answer to a question.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, Boolean, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from src.config.database import Base


class StudentAnswer(Base):
    """
    StudentAnswer model representing a student's answer to a question.
    
    Stores answers in JSONB format to support various question types.
    Includes grading results (is_correct, score) computed after submission.
    """
    
    __tablename__ = "student_answers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_exam_id = Column(UUID(as_uuid=True), ForeignKey("student_exams.id"), nullable=False)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False)
    answer_value = Column(JSONB, nullable=False)  # Stores any answer format
    is_correct = Column(Boolean, nullable=True)  # Computed after grading
    score = Column(Float, nullable=True)  # Computed after grading
    last_updated = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student_exam = relationship(
        "StudentExam",
        back_populates="student_answers"
    )
    
    question = relationship(
        "Question",
        back_populates="student_answers"
    )
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("student_exam_id", "question_id", name="uq_student_answer"),
    )
    
    def __repr__(self) -> str:
        """String representation of StudentAnswer instance."""
        return f"<StudentAnswer(id={self.id}, question_id={self.question_id}, score={self.score})>"
