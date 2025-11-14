"""Unit tests for src.utils.file_handler helpers."""
from __future__ import annotations

import io
import pytest
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from src.utils import file_handler


def _upload(filename: str, content: bytes, content_type: str) -> UploadFile:
    headers = Headers({"content-type": content_type})
    return UploadFile(filename=filename, file=io.BytesIO(content), headers=headers)


class TestValidateExcelFile:
    def test_validate_excel_file_accepts_valid_payload(self):
        upload = _upload(
            "questions.xlsx",
            b"binary data",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

        assert file_handler.validate_excel_file(upload) is True

    def test_validate_excel_file_rejects_bad_extension(self):
        upload = _upload("notes.txt", b"plain text", "text/plain")

        with pytest.raises(HTTPException):
            file_handler.validate_excel_file(upload)

    def test_validate_excel_file_flags_unexpected_content_type(self):
        upload = _upload("questions.xlsx", b"binary", "text/plain")

        assert file_handler.validate_excel_file(upload) is False


class TestSaveUploadFile:
    @pytest.mark.asyncio
    async def test_save_upload_file_writes_bytes(self, tmp_path):
        upload = _upload(
            "valid.xlsx",
            b"excel-bytes",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

        saved_path = await file_handler.save_upload_file(upload, str(tmp_path))

        with open(saved_path, "rb") as saved:
            assert saved.read() == b"excel-bytes"

    @pytest.mark.asyncio
    async def test_save_upload_file_raises_on_failure(self, tmp_path):
        upload = _upload(
            "broken.xlsx",
            b"content",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

        async def failing_read(_size: int = -1):
            raise RuntimeError("boom")

        upload.read = failing_read  # type: ignore[assignment]

        with pytest.raises(HTTPException):
            await file_handler.save_upload_file(upload, str(tmp_path))
