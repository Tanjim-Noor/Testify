"""
ExamQuestion model for the Online Exam Management System.

This module defines the ExamQuestion association table linking exams and questions.
"""

import uuid
from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from src.config.database import Base


class ExamQuestion(Base):
    """
    ExamQuestion association model linking exams and questions.
    
    This join table allows questions to be assigned to exams with a specific order.
    Each question can appear in multiple exams, and each exam can have multiple questions.
    """
    
    __tablename__ = "exam_questions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id = Column(UUID(as_uuid=True), ForeignKey("exams.id"), nullable=False)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False)
    order_index = Column(Integer, nullable=False)
    
    # Relationships
    exam = relationship(
        "Exam",
        back_populates="exam_questions"
    )
    
    question = relationship(
        "Question",
        back_populates="exam_questions"
    )
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("exam_id", "question_id", name="uq_exam_question"),
    )
    
    def __repr__(self) -> str:
        """String representation of ExamQuestion instance."""
        return f"<ExamQuestion(exam_id={self.exam_id}, question_id={self.question_id}, order={self.order_index})>"
