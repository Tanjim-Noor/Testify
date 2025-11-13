"""
Authentication API routes for user registration, login, and profile management.

This module defines FastAPI endpoints for:
- User registration
- User login (with JWT token generation)
- Get current user profile
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.models.user import User
from src.schemas.user import UserCreate, UserResponse, TokenResponse
from src.services.auth_service import register_user, authenticate_user
from src.utils.auth import create_access_token
from src.utils.dependencies import get_current_user

# Create router for auth endpoints
router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Create a new user account with email, password, and role"
)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Register a new user in the system.
    
    Args:
        user_data: UserCreate schema with email, password, and role
        db: Database session
        
    Returns:
        UserResponse containing the created user's information
        
    Raises:
        HTTPException: 409 if email already exists
    """
    try:
        created_user = register_user(user_data, db)
        return UserResponse.model_validate(created_user)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User login",
    description="Authenticate user and return JWT access token"
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> TokenResponse:
    """
    Authenticate user with email and password, return JWT token.
    
    Args:
        form_data: OAuth2 form data with username (email) and password
        db: Database session
        
    Returns:
        TokenResponse containing access token and user information
        
    Raises:
        HTTPException: 401 if credentials are invalid
    """
    # Authenticate user
    user = authenticate_user(form_data.username, form_data.password, db)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="Retrieve the current authenticated user's profile information"
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """
    Get the current authenticated user's profile.
    
    Args:
        current_user: Current user extracted from JWT token
        
    Returns:
        UserResponse containing user's information
    """
    return UserResponse.model_validate(current_user)
