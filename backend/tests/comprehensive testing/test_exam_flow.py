"""End-to-end student exam flow tests via FastAPI routes."""
from __future__ import annotations

from src.models.student_answer import StudentAnswer
from src.models.student_exam import ExamStatus
from tests.helpers import create_test_student_exam


class TestExamListing:
    def test_list_available_exams(self, client, sample_exam, student_headers):
        response = client.get("/api/student/exams", headers=student_headers)

        assert response.status_code == 200
        payload = response.json()
        assert any(row["exam_id"] == str(sample_exam.id) for row in payload)


class TestExamStart:
    def test_start_exam_success(self, client, sample_exam, student_headers):
        response = client.post(f"/api/student/exams/{sample_exam.id}/start", headers=student_headers)

        assert response.status_code == 201
        assert response.json()["status"] == ExamStatus.IN_PROGRESS.value

    def test_start_exam_already_started(self, client, student_exam, student_headers):
        response = client.post(f"/api/student/exams/{student_exam.exam_id}/start", headers=student_headers)

        assert response.status_code == 200
        assert response.json()["id"] == str(student_exam.id)

    def test_start_exam_already_submitted(self, client, db_session, sample_exam, student_headers, student_user):
        submitted = create_test_student_exam(
            db_session,
            exam_id=sample_exam.id,
            student_id=student_user.id,
            status=ExamStatus.SUBMITTED,
        )
        response = client.post(f"/api/student/exams/{submitted.exam_id}/start", headers=student_headers)

        assert response.status_code == 400

    def test_start_exam_not_available(self, client, sample_exam, student_headers, db_session):
        sample_exam.is_published = False
        db_session.commit()

        response = client.post(f"/api/student/exams/{sample_exam.id}/start", headers=student_headers)

        assert response.status_code == 400


class TestExamSession:
    def test_get_exam_session(self, client, student_exam, student_headers):
        response = client.get(f"/api/student/exams/{student_exam.id}", headers=student_headers)

        assert response.status_code == 200
        assert response.json()["student_exam"]["id"] == str(student_exam.id)

    def test_save_answer_success(self, client, student_exam, student_headers):
        question = student_exam.exam.exam_questions[0].question
        payload = {"question_id": str(question.id), "answer_value": {"answer": question.correct_answers[0]}}

        response = client.put(f"/api/student/exams/{student_exam.id}/answer", headers=student_headers, json=payload)

        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_save_answer_after_time_expired(self, client, monkeypatch, student_exam, student_headers):
        def fake_expire(db, se):
            return True

        monkeypatch.setattr("src.services.student_exam_service.check_and_expire_exam", fake_expire)
        question = student_exam.exam.exam_questions[0].question
        payload = {"question_id": str(question.id), "answer_value": {"answer": question.correct_answers[0]}}

        response = client.put(f"/api/student/exams/{student_exam.id}/answer", headers=student_headers, json=payload)

        assert response.status_code == 400


class TestExamSubmission:
    def test_submit_exam_success(self, client, student_exam, student_headers, db_session):
        question = student_exam.exam.exam_questions[0].question
        db_session.add(
            StudentAnswer(
                student_exam_id=student_exam.id,
                question_id=question.id,
                answer_value={"answer": question.correct_answers[0]},
            )
        )
        db_session.commit()

        response = client.post(f"/api/student/exams/{student_exam.id}/submit", headers=student_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["graded_count"] >= 1

    def test_submit_exam_already_submitted(self, client, db_session, sample_exam, student_headers, student_user):
        submitted = create_test_student_exam(
            db_session,
            exam_id=sample_exam.id,
            student_id=student_user.id,
            status=ExamStatus.SUBMITTED,
        )
        response = client.post(f"/api/student/exams/{submitted.id}/submit", headers=student_headers)

        assert response.status_code == 400