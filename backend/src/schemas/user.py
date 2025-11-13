"""
Pydantic schemas for user-related request and response models.

This module defines validation schemas for user registration, login, and responses.
"""

from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserCreate(BaseModel):
    """
    Schema for user registration request.
    
    Attributes:
        email: User's email address (must be valid email format)
        password: User's password (minimum 8 characters)
        role: User role - either 'admin' or 'student'
    """
    
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, description="Password (minimum 8 characters)")
    role: Literal["admin", "student"] = Field(..., description="User role")
    
    model_config = ConfigDict(json_schema_extra={
            "example": {
                "email": "john@example.com",
                "password": "securePassword123",
                "role": "student"
            }
        })


class UserLogin(BaseModel):
    """
    Schema for user login request.
    
    Attributes:
        email: User's email address
        password: User's password
    """
    
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")
    
    model_config = ConfigDict(json_schema_extra={
            "example": {
                "email": "john@example.com",
                "password": "securePassword123"
            }
        })


class UserResponse(BaseModel):
    """
    Schema for user response (excludes password_hash).
    
    Attributes:
        id: User's unique identifier (UUID)
        email: User's email address
        role: User's role (admin or student)
        created_at: When the user account was created
    """
    
    id: UUID = Field(..., description="User's unique identifier")
    email: str = Field(..., description="User's email address")
    role: str = Field(..., description="User's role")
    created_at: datetime = Field(..., description="Account creation timestamp")
    
    model_config = ConfigDict(from_attributes=True, json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "john@example.com",
                "role": "student",
                "created_at": "2024-01-15T10:30:00"
            }
        })


class TokenResponse(BaseModel):
    """
    Schema for authentication token response.
    
    Attributes:
        access_token: JWT access token
        token_type: Type of token (typically "bearer")
        user: User information (UserResponse)
    """
    
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user: UserResponse = Field(..., description="User information")
    
    model_config = ConfigDict(json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "email": "john@example.com",
                    "role": "student",
                    "created_at": "2024-01-15T10:30:00"
                }
            }
        })
