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


def test_question_crud_routes(monkeypatch):
    client = TestClient(app)

    # Allow admin access
    app.dependency_overrides.clear()
    from src.utils.dependencies import get_current_admin
    app.dependency_overrides[get_current_admin] = lambda: True

    from types import SimpleNamespace

    # Mock list
    fake_q = SimpleNamespace(
        id="00000000-0000-0000-0000-000000000001",
        title="A question",
        description="desc",
        complexity="easy",
        type="single_choice",
        options=["A", "B"],
        correct_answers=["A"],
        max_score=1,
        tags=["math"],
        created_at="2024-01-01T00:00:00Z",
    )

    monkeypatch.setattr(
        "src.services.question_service.get_questions",
        lambda db, filters, pagination: ([fake_q], 1),
    )

    response = client.get("/api/admin/questions")
    assert response.status_code == 200
    result = response.json()
    assert result["total"] == 1
    assert len(result["data"]) == 1

    # Mock get single
    monkeypatch.setattr(
        "src.services.question_service.get_question_by_id",
        lambda db, qid: fake_q,
    )

    response = client.get(f"/api/admin/questions/{fake_q.id}")
    assert response.status_code == 200
    assert response.json()["id"] == fake_q.id

    # Mock create
    monkeypatch.setattr(
        "src.services.question_service.create_question",
        lambda db, payload: fake_q,
    )

    payload = {
        "title": "A question",
        "description": "desc",
        "complexity": "easy",
        "type": "single_choice",
        "options": ["A", "B"],
        "correct_answers": ["A"],
        "max_score": 1,
        "tags": ["math"],
    }

    response = client.post("/api/admin/questions", json=payload)
    assert response.status_code == 201

    # Mock update
    monkeypatch.setattr(
        "src.services.question_service.update_question",
        lambda db, qid, payload: fake_q,
    )

    response = client.put(f"/api/admin/questions/{fake_q.id}", json=payload)
    assert response.status_code == 200

    # Mock delete
    monkeypatch.setattr(
        "src.services.question_service.delete_question",
        lambda db, qid: True,
    )

    response = client.delete(f"/api/admin/questions/{fake_q.id}")
    assert response.status_code == 200
    assert response.json()["message"] == "Question deleted"
