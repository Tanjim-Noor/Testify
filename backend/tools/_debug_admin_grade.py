from fastapi.testclient import TestClient
from types import SimpleNamespace
from uuid import uuid4
from src.main import app
from src.config.database import get_db

fake_ans = SimpleNamespace(
    id=str(uuid4()),
    question=SimpleNamespace(max_score=5),
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

app.dependency_overrides.clear()
app.dependency_overrides[get_db] = lambda: FakeDB()

from src.utils.dependencies import get_current_admin
app.dependency_overrides[get_current_admin] = lambda: SimpleNamespace(id=str(uuid4()))
from src.routes import exam as exam_routes
exam_routes.grading_service.regrade_exam = lambda db, sid: 10.0

client = TestClient(app)
resp = client.post(f"/api/admin/student-answers/{fake_ans.id}/grade", json={"score":3.5, "feedback":"Partial"})
print('STATUS', resp.status_code)
print(resp.text)
print(resp.json())
