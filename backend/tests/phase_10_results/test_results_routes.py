from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


# Quick helper to set current student
def set_student_auth(monkeypatch):
    from src.utils.dependencies import get_current_student
    app.dependency_overrides.clear()
    app.dependency_overrides[get_current_student] = lambda: SimpleNamespace(id=str(uuid4()))


def set_admin_auth(monkeypatch):
    from src.utils.dependencies import get_current_admin
    app.dependency_overrides.clear()
    app.dependency_overrides[get_current_admin] = lambda: SimpleNamespace(id=str(uuid4()))


# Student tests

def test_student_result_not_found(monkeypatch):
    set_student_auth(monkeypatch)
    # No StudentExam exists -> 404
    response = client.get(f"/api/student/results/{uuid4()}")
    assert response.status_code == 404


def test_student_get_result_by_exam(monkeypatch):
    # Set known student id so the StudentExam's student_id can match
    from src.utils.dependencies import get_current_student
    student_id = str(uuid4())
    app.dependency_overrides.clear()
    app.dependency_overrides[get_current_student] = lambda: SimpleNamespace(id=student_id)
    fake_se_id = str(uuid4())
    # provide a test stub for query
    from src.routes.student import get_db

    class FakeQuery:
        def filter(self, *args, **kwargs):
            return self

        def first(self):
            # Return a StudentExam-like simple namespace with same student id as current auth
            return SimpleNamespace(id=fake_se_id, exam_id=str(uuid4()), student_id=student_id, total_score=5.0, status=SimpleNamespace(value="submitted"), submitted_at=datetime.now(timezone.utc))

    class FakeDB:
        def query(self, model):
            return FakeQuery()

    app.dependency_overrides[get_db] = lambda: FakeDB()

    # Avoid running the real service: stub the service output
    from src.services import results_service
    monkeypatch.setattr("src.services.results_service.get_student_result", lambda db, seid, sid: {
        "student_exam_id": fake_se_id,
        "exam_title": "fake",
        "student_name": "s",
        "student_email": "s@example.com",
        "total_score": 5.0,
        "max_possible_score": 10.0,
        "percentage": 50.0,
        "submitted_at": datetime.now(timezone.utc),
        "status": "submitted",
        "question_results": [],
    })

    # Should return 200 now that ownership matches
    response = client.get(f"/api/student/results/exam/{uuid4()}")
    assert response.status_code == 200


def test_student_get_result_monkeypatched_service(monkeypatch):
    set_student_auth(monkeypatch)
    fake_student_exam_id = str(uuid4())

    fake_result = {
        "student_exam_id": fake_student_exam_id,
        "exam_title": "Fake",
        "student_name": "s",
        "student_email": "s@example.com",
        "total_score": 5.0,
        "max_possible_score": 10.0,
        "percentage": 50.0,
        "submitted_at": datetime.now(timezone.utc),
        "status": "submitted",
        "question_results": [],
    }

    monkeypatch.setattr("src.services.results_service.get_student_result", lambda db, seid, sid: fake_result)
    from src.routes.student import get_db
    app.dependency_overrides[get_db] = lambda: None

    response = client.get(f"/api/student/results/{fake_student_exam_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["student_exam_id"] == fake_student_exam_id
    assert data["percentage"] == 50.0


# Admin tests

def test_admin_get_exam_results(monkeypatch):
    set_admin_auth(monkeypatch)
    exam_id = str(uuid4())

    # create a fake exam with student_exams
    fake_student = SimpleNamespace(id=str(uuid4()), email="stu@example.com")
    fake_exam = SimpleNamespace(id=exam_id, title="Fake Exam", student_exams=[])
    fake_student_exam = SimpleNamespace(id=str(uuid4()), student_id=fake_student.id, student=fake_student, total_score=8.0, status=SimpleNamespace(value="submitted"), submitted_at=datetime.now(timezone.utc))
    fake_student_exam.exam = fake_exam
    fake_exam.student_exams = [fake_student_exam]

    class FakeQuery:
        def filter(self, *args, **kwargs):
            return self

        def first(self):
            return fake_exam

    class FakeDB:
        def query(self, model):
            return FakeQuery()

    from src.routes.exam import get_db
    app.dependency_overrides[get_db] = lambda: FakeDB()

    # patch the admin service to avoid deep DB usage
    monkeypatch.setattr("src.services.results_service.get_exam_results_for_admin", lambda db, eid: {
        "exam_summary": {"exam_id": exam_id, "exam_title": "Fake Exam", "total_students": 1, "average_score": 8.0, "highest_score": 8.0, "lowest_score": 8.0, "submission_count": 1},
        "student_results": [{"student_id": fake_student.id, "student_name": "stu", "student_email": "stu@example.com", "total_score": 8.0, "percentage": 80.0, "submitted_at": datetime.now(timezone.utc), "status": "submitted"}],
    })

    response = client.get(f"/api/admin/results/exams/{exam_id}")
    assert response.status_code == 200
    data = response.json()
    assert "exam_summary" in data
    assert isinstance(data["student_results"], list)


def test_admin_get_student_exam_detail(monkeypatch):
    set_admin_auth(monkeypatch)
    se_id = str(uuid4())

    fake_question = SimpleNamespace(id=str(uuid4()), title="Q1", type="single_choice", max_score=1, correct_answers=["A"]) 
    fake_exam = SimpleNamespace(id=str(uuid4()), title="Fake Exam", exam_questions=[SimpleNamespace(question=fake_question, order_index=0)])
    fake_student = SimpleNamespace(id=str(uuid4()), email="s@example.com")
    fake_student_exam = SimpleNamespace(id=se_id, exam=fake_exam, student=fake_student, total_score=1.0, status=SimpleNamespace(value="submitted"), submitted_at=datetime.now(timezone.utc))

    class FakeQuery:
        def filter(self, *args, **kwargs):
            return self
        def first(self):
            return fake_student_exam

        def all(self):
            return []

    class FakeDB:
        def query(self, model):
            return FakeQuery()

    from src.routes.exam import get_db
    app.dependency_overrides[get_db] = lambda: FakeDB()

    # patch admin service detail endpoint to avoid deep DB usage
    monkeypatch.setattr("src.services.results_service.get_student_exam_detail", lambda db, seid: {
        "student_exam_id": se_id,
        "exam_title": fake_exam.title,
        "student_name": fake_student.email.split("@")[0],
        "student_email": fake_student.email,
        "total_score": 1.0,
        "max_possible_score": 1.0,
        "percentage": 100.0,
        "submitted_at": datetime.now(timezone.utc),
        "status": "submitted",
        "question_results": [{"question_id": fake_question.id, "title": fake_question.title, "type": fake_question.type, "student_answer": {"answer": "A"}, "correct_answer": fake_question.correct_answers, "is_correct": True, "score": 1.0, "max_score": 1, "requires_manual_review": False}],
    })

    response = client.get(f"/api/admin/results/student-exams/{se_id}")
    assert response.status_code == 200
    data = response.json()
    assert "student_exam_id" in data
    assert isinstance(data["question_results"], list)


def test_admin_get_exam_statistics(monkeypatch):
    set_admin_auth(monkeypatch)
    exam_id = str(uuid4())

    # Patch the service directly to return some stats
    stats = {
        "exam_id": exam_id,
        "exam_title": "Fake Exam",
        "submission_count": 5,
        "total_students": 10,
        "average_score": 6.4,
        "median_score": 6.0,
        "highest_score": 9.0,
        "lowest_score": 2.0,
        "stddev": 1.3,
        "pass_rate": None,
    }
    monkeypatch.setattr("src.services.results_service.calculate_exam_statistics", lambda db, eid: stats)

    from src.routes.exam import get_db
    app.dependency_overrides[get_db] = lambda: None

    response = client.get(f"/api/admin/results/exams/{exam_id}/statistics")
    assert response.status_code == 200
    data = response.json()
    assert data["submission_count"] == 5


def test_admin_get_all_exams_for_student(monkeypatch):
    set_admin_auth(monkeypatch)
    # Create fake student_exams via DB override
    student_id = str(uuid4())
    fake_exam = SimpleNamespace(id=str(uuid4()), title="Exam1", exam_questions=[SimpleNamespace(question=SimpleNamespace(max_score=2))])
    fake_student_exam = SimpleNamespace(id=str(uuid4()), exam_id=fake_exam.id, exam=fake_exam, total_score=2.0, status=SimpleNamespace(value="submitted"), submitted_at=datetime.now(timezone.utc))

    class FakeQuery:
        def filter(self, *args, **kwargs):
            return self

        def all(self):
            return [fake_student_exam]

    class FakeDB:
        def query(self, model):
            return FakeQuery()

    from src.routes.exam import get_db
    app.dependency_overrides[get_db] = lambda: FakeDB()

    response = client.get(f"/api/admin/results/students/{student_id}/exams")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data[0]["exam_title"] == "Exam1"
