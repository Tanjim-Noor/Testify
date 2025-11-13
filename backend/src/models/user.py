"""
User model for the Online Exam Management System.

This module defines the User model representing both admin and student users.
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column
from src.config.database import Base


class UserRole(str, enum.Enum):
    """Enumeration for user roles in the system."""
    
    ADMIN = "admin"
    STUDENT = "student"


class User(Base):
    """
    User model representing system users (admins and students).
    
    Admins can create and manage exams, while students can take exams.
    """
    
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    student_exams = relationship(
        "StudentExam",
        back_populates="student",
        cascade="all, delete-orphan",
        foreign_keys="StudentExam.student_id"
    )
    
    created_exams = relationship(
        "Exam",
        back_populates="creator",
        cascade="all, delete-orphan",
        foreign_keys="Exam.created_by"
    )
    
    def __repr__(self) -> str:
        """String representation of User instance."""
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
