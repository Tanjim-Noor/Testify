"""
FastAPI dependency functions for authentication and authorization.

This module provides dependency injection functions for extracting and validating
user information from JWT tokens, and for role-based access control.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError

from src.config.database import get_db
from src.models.user import User, UserRole
from src.utils.auth import decode_access_token

# OAuth2 scheme for token extraction from Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to extract current user from JWT token.
    
    Decodes the JWT token, retrieves the user from the database by email,
    and returns the User object. Raises 401 Unauthorized if token is invalid
    or user is not found.
    
    Args:
        token: JWT token from Authorization header
        db: Database session
        
    Returns:
        User model instance
        
    Raises:
        HTTPException: 401 if token is invalid, expired, or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = decode_access_token(token)
        # decode_access_token may return None (Optional[Dict[str, Any]]),
        # ensure the payload is present before accessing it.
        if payload is None:
            raise credentials_exception

        email = payload.get("sub")
        # Ensure email is a string value (JWT sub claim usually contains the user identifier)
        if not isinstance(email, str):
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    
    if user is None:
        raise credentials_exception
    
    return user


def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to verify current user has admin role.
    
    Checks if the current user's role is 'admin'. Raises 403 Forbidden
    if the user is not an admin.
    
    Args:
        current_user: User object from get_current_user dependency
        
    Returns:
        User model instance (if authorized as admin)
        
    Raises:
        HTTPException: 403 if user is not an admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def get_current_student(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to verify current user has student role.
    
    Checks if the current user's role is 'student'. Raises 403 Forbidden
    if the user is not a student.
    
    Args:
        current_user: User object from get_current_user dependency
        
    Returns:
        User model instance (if authorized as student)
        
    Raises:
        HTTPException: 403 if user is not a student
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required"
        )
    return current_user
