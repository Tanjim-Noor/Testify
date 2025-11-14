from src.main import app
from fastapi.testclient import TestClient
from types import SimpleNamespace
from uuid import uuid4
import pytest

client = TestClient(app)


@pytest.fixture(autouse=True)
def admin_auth():
    app.dependency_overrides.clear()
    from src.utils.dependencies import get_current_admin

    app.dependency_overrides[get_current_admin] = lambda: SimpleNamespace(id=str(uuid4()))
    yield
    app.dependency_overrides.clear()


def test_manual_grade_endpoint(monkeypatch):
    fake_ans = SimpleNamespace(
        id=str(uuid4()),
        question=SimpleNamespace(max_score=5, id=str(uuid4())),
        question_id=str(uuid4()),
        student_exam_id=str(uuid4()),
        score=None,
        is_correct=None,
        answer_value={},
    )

    class FakeQuery:
        def filter(self, *args, **kwargs):
            return self

        def first(self):
            return fake_ans

    class FakeDB:
        def query(self, model):
            return FakeQuery()

        def commit(self):
            return True

        def refresh(self, obj):
            return
        
        def rollback(self):
            return True

    # FastAPI dependencies should be overridden using app.dependency_overrides
    # FastAPI uses the `get_db` dependency from config; override the original
    from src.config.database import get_db
    app.dependency_overrides[get_db] = lambda: FakeDB()
    monkeypatch.setattr("src.routes.exam.grading_service.regrade_exam", lambda db, sid: 10.0)

    # Use fake admin from fixture; just assert audit fields are set
    payload = {"score": 3.5, "feedback": "Partial"}
    resp = client.post(f"/api/admin/student-answers/{fake_ans.id}/grade", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["score"] == 3.5
    assert data["id"] == fake_ans.id
    # Ensure graded_by and graded_at were set on the object
    assert fake_ans.graded_by is not None
    assert fake_ans.graded_at is not None
    # Clear dependency overrides to avoid cross-test pollution
    from src.config.database import get_db as _g
    app.dependency_overrides.pop(_g, None)
