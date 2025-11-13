"""
Authentication service for user registration and login.

This module provides business logic for user registration, login validation,
and user database operations.
"""

from sqlalchemy.orm import Session
from src.models.user import User, UserRole
from src.schemas.user import UserCreate
from src.utils.auth import get_password_hash, verify_password


def register_user(user_data: UserCreate, db: Session) -> User:
    """
    Register a new user in the system.
    
    Checks if the email already exists. If not, hashes the password and
    creates a new User record in the database.
    
    Args:
        user_data: UserCreate schema containing email, password, and role
        db: Database session
        
    Returns:
        Created User model instance
        
    Raises:
        ValueError: If email already exists
        Exception: If database operation fails
    """
    try:
        # Check if user with this email already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        
        if existing_user:
            raise ValueError(f"User with email {user_data.email} already exists")
        
        # Hash the password
        password_hash = get_password_hash(user_data.password)
        
        # Create new user
        new_user = User(
            email=user_data.email,
            password_hash=password_hash,
            role=UserRole[user_data.role.upper()]
        )
        
        # Add to database session and commit
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return new_user
        
    except ValueError as e:
        raise e
    except Exception as e:
        db.rollback()
        raise Exception(f"Error registering user: {str(e)}")


def authenticate_user(email: str, password: str, db: Session) -> User | None:
    """
    Authenticate a user by verifying email and password.
    
    Queries the user by email and verifies the provided password against
    the stored password hash. Returns the User if authentication is successful,
    None otherwise.
    
    Args:
        email: User's email address
        password: User's password (plain text)
        db: Database session
        
    Returns:
        User model instance if authentication successful, None otherwise
        
    Raises:
        Exception: If database operation fails
    """
    try:
        # Query user by email
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            return None
        
        # Verify password
        if not verify_password(password, user.password_hash):
            return None
        
        return user
        
    except Exception as e:
        raise Exception(f"Error authenticating user: {str(e)}")
