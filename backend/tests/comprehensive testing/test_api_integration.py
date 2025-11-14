"""High-level integration scenarios across admin and student APIs."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from src.models.student_answer import StudentAnswer
from src.models.student_exam import ExamStatus, StudentExam


class TestAdminWorkflow:
    def test_admin_creates_exam_workflow(self, client, admin_headers):
        now = datetime.now(timezone.utc)
        question_payload = {
            "title": "API created question",
            "description": "integration",
            "complexity": "easy",
            "type": "single_choice",
            "options": ["A", "B", "C"],
            "correct_answers": ["A"],
            "max_score": 2,
            "tags": ["integration"],
        }
        question_response = client.post("/api/admin/questions", headers=admin_headers, json=question_payload)
        assert question_response.status_code == 201
        question_id = question_response.json()["id"]

        exam_payload = {
            "title": "Integration Exam",
            "description": "Created via API test",
            "start_time": (now - timedelta(minutes=1)).isoformat(),
            "end_time": (now + timedelta(hours=1)).isoformat(),
            "duration_minutes": 30,
        }
        exam_response = client.post("/api/admin/exams", headers=admin_headers, json=exam_payload)
        assert exam_response.status_code == 201
        exam_id = exam_response.json()["id"]

        assign_payload = [{"question_id": question_id, "order_index": 0}]
        assign_response = client.post(f"/api/admin/exams/{exam_id}/questions", headers=admin_headers, json=assign_payload)
        assert assign_response.status_code == 200
        assert len(assign_response.json()["questions"]) == 1

        publish_response = client.put(f"/api/admin/exams/{exam_id}/publish", headers=admin_headers, json={"is_published": True})
        assert publish_response.status_code == 200
        assert publish_response.json()["is_published"] is True


class TestStudentWorkflow:
    def test_student_takes_exam_workflow(self, client, sample_exam, student_headers):
        list_response = client.get("/api/student/exams", headers=student_headers)
        assert list_response.status_code == 200
        assert any(row["exam_id"] == str(sample_exam.id) for row in list_response.json())

        start_response = client.post(f"/api/student/exams/{sample_exam.id}/start", headers=student_headers)
        assert start_response.status_code in (200, 201)
        student_exam_id = start_response.json()["id"]

        session_response = client.get(f"/api/student/exams/{student_exam_id}", headers=student_headers)
        assert session_response.status_code == 200
        question_id = session_response.json()["questions"][0]["id"]

        save_payload = {"question_id": question_id, "answer_value": {"answer": "Option A"}}
        save_response = client.put(f"/api/student/exams/{student_exam_id}/answer", headers=student_headers, json=save_payload)
        assert save_response.status_code == 200

        submit_response = client.post(f"/api/student/exams/{student_exam_id}/submit", headers=student_headers)
        assert submit_response.status_code == 200
        assert submit_response.json()["student_exam_id"] == student_exam_id


class TestAdminResultsWorkflow:
    def test_admin_reviews_results_workflow(self, client, admin_headers, sample_exam, db_session, student_user):
        student_exam = StudentExam(
            exam_id=sample_exam.id,
            student_id=student_user.id,
            status=ExamStatus.SUBMITTED,
            started_at=datetime.now(timezone.utc) - timedelta(minutes=10),
            submitted_at=datetime.now(timezone.utc),
            total_score=3.0,
        )
        db_session.add(student_exam)
        db_session.commit()
        db_session.refresh(student_exam)

        question = sample_exam.exam_questions[0].question
        db_session.add(
            StudentAnswer(
                student_exam_id=student_exam.id,
                question_id=question.id,
                answer_value={"answer": question.correct_answers[0]},
                score=float(question.max_score),
                is_correct=True,
            )
        )
        db_session.commit()

        exam_results = client.get(f"/api/admin/results/exams/{sample_exam.id}", headers=admin_headers)
        assert exam_results.status_code == 200
        assert exam_results.json()["exam_summary"]["total_students"] >= 1

        detail_response = client.get(f"/api/admin/results/student-exams/{student_exam.id}", headers=admin_headers)
        assert detail_response.status_code == 200
        assert detail_response.json()["student_exam_id"] == str(student_exam.id)

        stats_response = client.get(f"/api/admin/results/exams/{sample_exam.id}/statistics", headers=admin_headers)
        assert stats_response.status_code == 200
        assert stats_response.json()["submission_count"] >= 1
