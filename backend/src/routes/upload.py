"""
File upload API routes for exam answer images.

This module handles secure file uploads for student exam answers,
including validation, storage, and serving of uploaded images.
"""

import uuid
import logging
import os
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.config.settings import settings
from src.models.user import User
from src.utils.dependencies import get_current_user

# Configure logging
logger = logging.getLogger(__name__)

# Create router for upload endpoints
router = APIRouter(
    prefix="/api/uploads",
    tags=["File Uploads"]
)

# Allowed image MIME types
ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/gif",
    "image/webp"
}

# File signature validation (magic numbers)
FILE_SIGNATURES = {
    b'\xFF\xD8\xFF': 'image/jpeg',  # JPEG
    b'\x89PNG\r\n\x1a\n': 'image/png',  # PNG
    b'GIF87a': 'image/gif',  # GIF87a
    b'GIF89a': 'image/gif',  # GIF89a
    b'RIFF': 'image/webp',  # WEBP (needs additional check)
}

# Maximum file size (5MB)
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB in bytes


def validate_image_file(file: UploadFile) -> None:
    """
    Validate uploaded image file.
    
    Args:
        file: Uploaded file to validate
        
    Raises:
        HTTPException: If file is invalid
    """
    # Check content type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        logger.warning(f"Invalid file type uploaded: {file.content_type}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )
    
    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > MAX_FILE_SIZE:
        logger.warning(f"File too large: {file_size} bytes")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum of {MAX_FILE_SIZE / (1024 * 1024)}MB"
        )
    
    # Validate file signature (magic numbers)
    file_header = file.file.read(8)
    file.file.seek(0)  # Reset to beginning
    
    valid_signature = False
    for signature in FILE_SIGNATURES.keys():
        if file_header.startswith(signature):
            valid_signature = True
            break
    
    if not valid_signature:
        logger.warning(f"Invalid file signature for file: {file.filename}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File signature does not match allowed image types"
        )


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    # Remove path components
    filename = os.path.basename(filename)
    
    # Remove potentially dangerous characters
    dangerous_chars = ['/', '\\', '..', '~', '$', '&', '|', ';', '`']
    for char in dangerous_chars:
        filename = filename.replace(char, '')
    
    return filename


def get_file_extension(filename: str) -> str:
    """
    Extract file extension from filename.
    
    Args:
        filename: Original filename
        
    Returns:
        File extension including dot (e.g., '.jpg')
    """
    return Path(filename).suffix.lower()


@router.post(
    "/images",
    summary="Upload image file",
    description="Upload an image file for exam answer. Returns file URL.",
    response_model=dict
)
async def upload_image(
    file: UploadFile = File(..., description="Image file to upload"),
    student_exam_id: Optional[str] = None,
    question_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict:
    """
    Upload an image file for exam answer.
    
    Args:
        file: Uploaded image file
        student_exam_id: Optional student exam ID for organization
        question_id: Optional question ID for organization
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        Dictionary containing file URL and metadata
        
    Raises:
        HTTPException: If file is invalid or upload fails
    """
    try:
        logger.info(f"User {current_user.id} uploading image: {file.filename}")
        
        # Read file contents first (before validation consumes the stream)
        contents = await file.read()
        file_size = len(contents)
        
        # Check file size
        if file_size > MAX_FILE_SIZE:
            logger.warning(f"File too large: {file_size} bytes")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum of {MAX_FILE_SIZE / (1024 * 1024)}MB"
            )
        
        # Check content type
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            logger.warning(f"Invalid file type uploaded: {file.content_type}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
            )
        
        # Validate file signature (magic numbers)
        file_header = contents[:8]
        valid_signature = False
        for signature in FILE_SIGNATURES.keys():
            if file_header.startswith(signature):
                valid_signature = True
                break
        
        if not valid_signature:
            logger.warning(f"Invalid file signature for file: {file.filename}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File signature does not match allowed image types"
            )
        
        # Sanitize original filename
        original_filename = sanitize_filename(file.filename or 'image.jpg')
        file_extension = get_file_extension(original_filename)
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Create directory structure: uploads/exam-answers/{user_id}/{student_exam_id}/
        upload_dir = Path(str(settings.BASE_DIR)) / "uploads" / "exam-answers" / str(current_user.id)
        
        if student_exam_id:
            upload_dir = upload_dir / str(student_exam_id)
        
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Full file path
        file_path = upload_dir / unique_filename
        
        # Save file (we already have contents from earlier read)
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
        
        # Generate file URL (relative path from uploads directory)
        relative_path = f"exam-answers/{current_user.id}"
        if student_exam_id:
            relative_path = f"{relative_path}/{student_exam_id}"
        relative_path = f"{relative_path}/{unique_filename}"
        
        file_url = f"/api/uploads/{relative_path}"
        
        logger.info(f"File uploaded successfully: {file_url}")
        
        # Return file metadata
        return {
            "success": True,
            "file_url": file_url,
            "filename": original_filename,
            "file_size": file_size,
            "mime_type": file.content_type,
            "message": "File uploaded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file. Please try again."
        )


@router.get(
    "/exam-answers/{filepath:path}",
    summary="Get uploaded image",
    description="Retrieve an uploaded image file.",
    response_class=FileResponse
)
async def get_uploaded_image(
    filepath: str,
    db: Session = Depends(get_db)
) -> FileResponse:
    """
    Retrieve an uploaded image file.
    
    Args:
        filepath: Relative file path
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        FileResponse containing the image file
        
    Raises:
        HTTPException: If file not found or access denied
    """
    try:
        # Sanitize filepath to prevent path traversal
        filepath = filepath.replace('..', '').replace('~', '')
        
        # Construct full file path
        full_path = Path(str(settings.BASE_DIR)) / "uploads" / "exam-answers" / filepath
        
        # Check if file exists
        if not full_path.exists() or not full_path.is_file():
            logger.warning(f"File not found: {full_path}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        # Security check: ensure file is within uploads directory
        uploads_dir = Path(str(settings.BASE_DIR)) / "uploads" / "exam-answers"
        try:
            full_path.resolve().relative_to(uploads_dir.resolve())
        except ValueError:
            logger.error(f"Path traversal attempt detected: {filepath}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Optional: Check if user has access to this file
        # For now, any authenticated user can access files
        # TODO: Implement more granular access control (check if user owns the exam)
        
        logger.info(f"Accessing file: {filepath}")
        
        # Determine media type based on extension
        media_type_mapping = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        }
        
        extension = full_path.suffix.lower()
        media_type = media_type_mapping.get(extension, 'application/octet-stream')
        
        # Return file
        return FileResponse(
            path=str(full_path),
            media_type=media_type,
            filename=full_path.name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving file: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve file"
        )
