"""
Utility functions for handling uploaded files (saving and validating Excel files).
"""
from __future__ import annotations

import os
import uuid
from typing import Optional

from fastapi import HTTPException, UploadFile
from fastapi import status as http_status


def validate_excel_file(upload_file: UploadFile) -> bool:
    """Validate that provided UploadFile is an Excel file (.xlsx).

    Raises HTTPException if validation fails.
    """
    filename = upload_file.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    content_type = (upload_file.content_type or "").lower()

    if ext != ".xlsx":
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Only .xlsx files are supported")

    # Accept common excel content types; some clients may send application/octet-stream
    allowed_content_types = {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/octet-stream",
    }

    if content_type not in allowed_content_types:
        # We don't raise for content_type mismatches alone because some clients provide wildcards
        # but additional check above ensures the extension is .xlsx
        return False
    return True


async def save_upload_file(upload_file: UploadFile, destination_dir: str) -> str:
    """Save an incoming UploadFile to destination_dir with a unique filename and return saved path.

    Args:
        upload_file: FastAPI UploadFile
        destination_dir: Directory where to save the file (will be created if not present)

    Returns:
        Path to saved file

    Raises:
        HTTPException on IO errors
    """
    if not os.path.exists(destination_dir):
        os.makedirs(destination_dir, exist_ok=True)

    ext = os.path.splitext(upload_file.filename or "")[1] or ".xlsx"
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(destination_dir, unique_name)

    try:
        with open(file_path, "wb") as buffer:
            # read in chunks to avoid memory spikes
            while True:
                chunk = await upload_file.read(1024 * 64)
                if not chunk:
                    break
                buffer.write(chunk)
        return file_path
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to save uploaded file: {e}")
