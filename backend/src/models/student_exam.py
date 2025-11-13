"""
StudentExam model for the Online Exam Management System.

This module defines the StudentExam model representing a student's exam session.
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, Float, DateTime, ForeignKey, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from src.config.database import Base


class ExamStatus(str, enum.Enum):
    """Enumeration for exam status."""
    
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    EXPIRED = "expired"


class StudentExam(Base):
    """
    StudentExam model representing a student's exam session.
    
    Tracks a student's progress through an exam including start time,
    submission time, and calculated score.
    """
    
    __tablename__ = "student_exams"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id = Column(UUID(as_uuid=True), ForeignKey("exams.id"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    total_score = Column(Float, nullable=True)
    status = Column(SQLEnum(ExamStatus), nullable=False, default=ExamStatus.NOT_STARTED)
    
    # Relationships
    exam = relationship(
        "Exam",
        back_populates="student_exams"
    )
    
    student = relationship(
        "User",
        back_populates="student_exams",
        foreign_keys=[student_id]
    )
    
    student_answers = relationship(
        "StudentAnswer",
        back_populates="student_exam",
        cascade="all, delete-orphan"
    )
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("exam_id", "student_id", name="uq_student_exam"),
    )
    
    def __repr__(self) -> str:
        """String representation of StudentExam instance."""
        return f"<StudentExam(id={self.id}, student_id={self.student_id}, exam_id={self.exam_id}, status={self.status})>"
