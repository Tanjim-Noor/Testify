from datetime import datetime, timezone, timedelta
import pytest
from types import SimpleNamespace
from uuid import uuid4
from fastapi.testclient import TestClient
from src.main import app

from src.schemas.student_exam import AnswerSubmission

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
        start_time=datetime.now(timezone.utc) - timedelta(hours=1),
        end_time=datetime.now(timezone.utc) + timedelta(hours=2),
        duration_minutes=60,
        is_published=True,
        created_by=str(uuid4()),
        created_at=datetime.now(timezone.utc),
        exam_questions=[SimpleNamespace(question=fake_q, order_index=0)],
    )
    return fake_exam


@pytest.fixture(autouse=True)
def student_auth(monkeypatch):
    # Clear previous overrides and set student
    from src.utils.dependencies import get_current_student
    app.dependency_overrides.clear()
    app.dependency_overrides[get_current_student] = lambda: SimpleNamespace(id=str(uuid4()))
    yield
    app.dependency_overrides.clear()


def test_list_exams(monkeypatch):
    fake_exam = make_fake_exam()
    
    # Mock the database query for StudentExam
    from src.models.student_exam import StudentExam
    mock_student_exams = []
    
    def mock_db_query(*args, **kwargs):
        class MockQuery:
            def filter(self, *args, **kwargs):
                return self
            def all(self):
                return mock_student_exams
        return MockQuery()
    
    monkeypatch.setattr("src.services.student_exam_service.get_available_exams", lambda db, sid: [fake_exam])
    
    # Mock the db.query to return empty student exams
    import src.routes.student as student_module
    original_get_db = app.dependency_overrides.get(student_module.get_db)
    
    def mock_get_db():
        class MockDB:
            def query(self, *args):
                return mock_db_query()
        return MockDB()
    
    from src.routes.student import get_db
    app.dependency_overrides[get_db] = mock_get_db
    
    response = client.get("/api/student/exams")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data[0]["title"] == fake_exam.title
    # Verify new fields are present
    assert "student_exam_id" in data[0]
    assert "submission_status" in data[0]
    
    # Restore original override
    if original_get_db:
        app.dependency_overrides[get_db] = original_get_db
    else:
        app.dependency_overrides.pop(get_db, None)


def test_start_exam(monkeypatch):
    fake_exam = make_fake_exam()
    fake_student_exam = SimpleNamespace(id=str(uuid4()), exam_id=fake_exam.id, student_id=str(uuid4()), started_at=datetime.now(timezone.utc), submitted_at=None, status=SimpleNamespace(value="in_progress"))
    monkeypatch.setattr("src.services.student_exam_service.start_exam", lambda db, eid, sid: fake_student_exam)
    response = client.post(f"/api/student/exams/{fake_exam.id}/start")
    assert response.status_code in (200, 201)
    data = response.json()
    assert data["exam_id"] == fake_exam.id


def test_get_exam_session(monkeypatch):
    fake_exam = make_fake_exam()
    student_exam = SimpleNamespace(id=str(uuid4()), exam_id=fake_exam.id, student_id=str(uuid4()), started_at=datetime.now(timezone.utc), submitted_at=None, status=SimpleNamespace(value="in_progress"))
    qs = [fake_exam.exam_questions[0].question]
    answers = {qs[0].id: {"text": "sample answer"}}

    monkeypatch.setattr("src.services.student_exam_service.get_exam_session", lambda db, seid, sid: {
        "student_exam": student_exam,
        "exam": fake_exam,
        "questions": qs,
        "answers": answers,
        "time_remaining": 1200,
        "expired": False,
    })

    response = client.get(f"/api/student/exams/{student_exam.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["exam_details"]["title"] == fake_exam.title
    # Ensure correct answers are not exposed to the student
    assert "correct_answers" not in data["questions"][0]


def test_save_answer(monkeypatch):
    fake_exam = make_fake_exam()
    student_exam_id = str(uuid4())
    ans = {"question_id": fake_exam.exam_questions[0].question.id, "answer_value": {"text": "hello"}}
    monkeypatch.setattr("src.services.student_exam_service.save_answer", lambda db, seid, sid, a: True)
    response = client.put(f"/api/student/exams/{student_exam_id}/answer", json=ans)
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_submit_exam(monkeypatch):
    student_exam_id = str(uuid4())
    se = SimpleNamespace(id=student_exam_id, submitted_at=datetime.now(timezone.utc))
    monkeypatch.setattr("src.services.student_exam_service.submit_exam", lambda db, seid, sid: se)
    # Provide a fake DB that returns 0 counts for grading queries
    class FakeQuery:
        def filter(self, *args, **kwargs):
            return self

        def count(self):
            return 0
        def all(self):
            return []

    class FakeDB:
        def query(self, model):
            return FakeQuery()

    from src.routes.student import get_db
    app.dependency_overrides[get_db] = lambda: FakeDB()

    response = client.post(f"/api/student/exams/{student_exam_id}/submit")
    app.dependency_overrides.clear()
    assert response.status_code == 200
    data = response.json()
    assert data["student_exam_id"] == student_exam_id
