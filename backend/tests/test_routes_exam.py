from datetime import datetime, timezone, timedelta
from types import SimpleNamespace
from uuid import uuid4
from fastapi.testclient import TestClient
from src.main import app
import pytest

from src.schemas.exam import ExamQuestionAssignment

client = TestClient(app)


def make_fake_exam():
    fake_q = SimpleNamespace(
        id=str(uuid4()),
        title="Q1",
        description="desc",
        complexity="easy",
        type="text",
        options=None,
        correct_answers=None,
        max_score=1,
        tags=["sample"],
        created_at=datetime.now(timezone.utc),
    )

    fake_exam = SimpleNamespace(
        id=str(uuid4()),
        title="Midterm",
        description="desc",
        start_time=datetime.now(timezone.utc) + timedelta(days=1),
        end_time=datetime.now(timezone.utc) + timedelta(days=2),
        duration_minutes=60,
        is_published=False,
        created_by=str(uuid4()),
        created_at=datetime.now(timezone.utc),
        exam_questions=[SimpleNamespace(question=fake_q)],
    )
    return fake_exam


@pytest.fixture(autouse=True)
def admin_auth():
    app.dependency_overrides.clear()
    from src.utils.dependencies import get_current_admin
    # Provide a fake admin user object with an id attribute
    app.dependency_overrides[get_current_admin] = lambda: SimpleNamespace(id=str(uuid4()))
    yield
    app.dependency_overrides.clear()


def test_create_exam_success(monkeypatch):
    fake_exam = make_fake_exam()

    monkeypatch.setattr("src.services.exam_service.create_exam", lambda db, payload, admin_id: fake_exam)

    payload = {
        "title": fake_exam.title,
        "description": fake_exam.description,
        "start_time": (fake_exam.start_time).isoformat(),
        "end_time": (fake_exam.end_time).isoformat(),
        "duration_minutes": fake_exam.duration_minutes,
    }

    response = client.post("/api/admin/exams", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == fake_exam.title


def test_create_exam_invalid_time_range():
    # Should fail schema validation (start >= end)
    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = start
    payload = {
        "title": "Broken Exam",
        "description": "desc",
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "duration_minutes": 60,
    }
    response = client.post("/api/admin/exams", json=payload)
    assert response.status_code == 422


def test_list_exams(monkeypatch):
    fake_exam = make_fake_exam()
    monkeypatch.setattr("src.services.exam_service.get_exams", lambda db, filters: [fake_exam])
    response = client.get("/api/admin/exams")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_exam_not_found(monkeypatch):
    monkeypatch.setattr("src.services.exam_service.get_exam_by_id", lambda db, eid: None)
    response = client.get(f"/api/admin/exams/{str(uuid4())}")
    assert response.status_code == 404


def test_update_locked_exam(monkeypatch):
    # Service raises ValueError when attempt to update locked published exam
    monkeypatch.setattr("src.services.exam_service.update_exam", lambda db, eid, payload: (_ for _ in ()).throw(ValueError("Cannot update exam")))
    response = client.put(f"/api/admin/exams/{str(uuid4())}", json={})
    assert response.status_code == 400


def test_delete_locked_exam(monkeypatch):
    monkeypatch.setattr("src.services.exam_service.delete_exam", lambda db, eid: (_ for _ in ()).throw(ValueError("Cannot delete exam with student submissions")))
    response = client.delete(f"/api/admin/exams/{str(uuid4())}")
    assert response.status_code == 400


def test_assign_questions_and_reorder(monkeypatch):
    fake_exam = make_fake_exam()
    monkeypatch.setattr("src.services.exam_service.assign_questions", lambda db, eid, payload: fake_exam)

    assign_payload = [
        {"question_id": str(uuid4()), "order_index": 0},
    ]

    response = client.post(f"/api/admin/exams/{fake_exam.id}/questions", json=assign_payload)
    assert response.status_code == 200

    # Reorder
    monkeypatch.setattr("src.services.exam_service.reorder_questions", lambda db, eid, payload: True)
    qids = [str(uuid4()), str(uuid4())]
    response = client.put(f"/api/admin/exams/{fake_exam.id}/questions/reorder", json=qids)
    assert response.status_code == 200
    assert response.json()["message"] == "Questions reordered"


def test_publish_with_and_without_questions(monkeypatch):
    fake_exam = make_fake_exam()
    # publishing with no questions - service throws
    monkeypatch.setattr("src.services.exam_service.publish_exam", lambda db, eid, val: (_ for _ in ()).throw(ValueError("Cannot publish exam without assigned questions")))
    response = client.put(f"/api/admin/exams/{fake_exam.id}/publish", json={"is_published": True})
    assert response.status_code == 400

    # successful publish
    monkeypatch.setattr("src.services.exam_service.publish_exam", lambda db, eid, val: fake_exam)
    response = client.put(f"/api/admin/exams/{fake_exam.id}/publish", json={"is_published": True})
    assert response.status_code == 200


def test_delete_success(monkeypatch):
    fake_id = str(uuid4())
    monkeypatch.setattr("src.services.exam_service.delete_exam", lambda db, eid: True)
    response = client.delete(f"/api/admin/exams/{fake_id}")
    assert response.status_code == 200
    assert response.json()["message"] == "Exam deleted"
