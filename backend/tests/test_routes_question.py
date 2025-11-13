import os
from pathlib import Path
from fastapi.testclient import TestClient
from openpyxl import Workbook

from src.main import app
from src.schemas.question import ImportResult


def create_sample_file(path: Path):
    wb = Workbook()
    sheet = wb.active
    sheet.append(["title", "description", "complexity", "type", "options", "correct_answers", "max_score", "tags"])
    sheet.append(["What is 2+2?", "Simple", "easy", "single_choice", "[\"A\", \"B\", \"C\"]", "[\"B\"]", 1, "math"])
    wb.save(path)


def test_import_route_success(monkeypatch, tmp_path: Path):
    client = TestClient(app)

    # Create a temp file to upload
    file_path = tmp_path / "upload.xlsx"
    create_sample_file(file_path)

    # Override authentication dependency to allow the request
    def fake_admin():
        return True

    app.dependency_overrides.clear()
    from src.utils.dependencies import get_current_admin
    app.dependency_overrides[get_current_admin] = lambda: True

    # Monkeypatch process_excel_import to avoid DB needs
    def fake_process(file_path_arg, db):
        return ImportResult(success_count=1, error_count=0, errors=[])

    import src.services.question_service as qs
    monkeypatch.setattr(qs, "process_excel_import", lambda path, db: fake_process(path, db))

    with open(file_path, "rb") as f:
        response = client.post("/api/admin/questions/import", files={"file": (file_path.name, f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})

    assert response.status_code == 200
    data = response.json()
    assert data["success_count"] == 1
    assert data["error_count"] == 0
