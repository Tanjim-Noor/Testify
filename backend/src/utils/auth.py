"""
Authentication utilities for password hashing and JWT token management.

This module provides functions for secure password hashing using bcrypt directly
and JWT token creation/validation using python-jose.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
import bcrypt
from jose import JWTError, jwt
from src.config.settings import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against its hashed version using bcrypt.
    
    Args:
        plain_password: The plain text password to verify
        hashed_password: The hashed password to verify against (bcrypt hash string)
        
    Returns:
        True if password matches the hash, False otherwise
        
    Raises:
        Exception: If verification encounters an unexpected error
    """
    try:
        # Convert string password to bytes
        password_bytes = plain_password.encode('utf-8')
        # Convert hash string to bytes if needed
        hash_bytes = hashed_password.encode('utf-8') if isinstance(hashed_password, str) else hashed_password
        # Verify using bcrypt
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception as e:
        raise Exception(f"Error verifying password: {str(e)}")


def get_password_hash(password: str) -> str:
    """
    Hash a plain password using bcrypt.
    
    Args:
        password: The plain text password to hash
        
    Returns:
        The hashed password as a string
        
    Raises:
        Exception: If hashing encounters an unexpected error
    """
    try:
        # Convert password to bytes
        password_bytes = password.encode('utf-8')
        # Generate salt and hash password
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        # Return hash as string for database storage
        return hashed.decode('utf-8')
    except Exception as e:
        raise Exception(f"Error hashing password: {str(e)}")


def create_access_token(data: Dict[str, Any]) -> str:
    """
    Create a JWT access token with user data and expiration.
    
    The token includes:
    - user data (typically email/user id)
    - expiration time (from JWT_EXPIRATION setting)
    - token type
    
    Args:
        data: Dictionary containing user information to encode in token
              (typically {"sub": email})
        
    Returns:
        Encoded JWT token string
        
    Raises:
        Exception: If token creation encounters an error
    """
    try:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.JWT_EXPIRATION
        )
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET,
            algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt
    except Exception as e:
        raise Exception(f"Error creating access token: {str(e)}")


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a JWT access token.
    
    Args:
        token: The JWT token to decode
        
    Returns:
        Dictionary containing the decoded token payload
        
    Raises:
        JWTError: If token is invalid, expired, or cannot be decoded
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        raise JWTError(f"Invalid or expired token: {str(e)}")
