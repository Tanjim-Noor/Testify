"""Admin exam route coverage tests."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import status

from src.models.student_answer import StudentAnswer
from src.models.student_exam import ExamStatus
from tests.helpers import (
    create_test_exam,
    create_test_question,
    create_test_student_exam,
    create_test_user,
)


class TestAdminExamRoutes:
    def _exam_payload(self, title: str = "Route Exam") -> dict:
        start = datetime.now(timezone.utc) - timedelta(minutes=5)
        end = start + timedelta(hours=2)
        return {
            "title": title,
            "description": "Route-driven exam",
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "duration_minutes": 90,
        }

    def test_admin_exam_crud_flow(self, client, admin_headers, db_session, admin_user):
        question = create_test_question(db_session, qtype="single_choice", title="Assigned Question")

        create_resp = client.post("/api/admin/exams", json=self._exam_payload(), headers=admin_headers)
        assert create_resp.status_code == status.HTTP_201_CREATED
        exam_id = UUID(create_resp.json()["id"])

        list_resp = client.get("/api/admin/exams", headers=admin_headers)
        assert list_resp.status_code == status.HTTP_200_OK and len(list_resp.json()) >= 1

        detail_resp = client.get(f"/api/admin/exams/{exam_id}", headers=admin_headers)
        assert detail_resp.status_code == status.HTTP_200_OK

        update_resp = client.put(f"/api/admin/exams/{exam_id}", json={"title": "Updated Exam Title"}, headers=admin_headers)
        assert update_resp.status_code == status.HTTP_200_OK and update_resp.json()["title"] == "Updated Exam Title"

        assignment_payload = [{"question_id": str(question.id), "order_index": 0}]
        assign_resp = client.post(f"/api/admin/exams/{exam_id}/questions", json=assignment_payload, headers=admin_headers)
        assert assign_resp.status_code == status.HTTP_200_OK

        reorder_resp = client.put(
            f"/api/admin/exams/{exam_id}/questions/reorder",
            json=[str(question.id)],
            headers=admin_headers,
        )
        assert reorder_resp.status_code == status.HTTP_200_OK

        publish_resp = client.put(
            f"/api/admin/exams/{exam_id}/publish",
            json={"is_published": True},
            headers=admin_headers,
        )
        assert publish_resp.status_code == status.HTTP_200_OK and publish_resp.json()["is_published"] is True

        delete_resp = client.delete(f"/api/admin/exams/{exam_id}", headers=admin_headers)
        assert delete_resp.status_code == status.HTTP_200_OK

    def test_manual_grade_answer_endpoint(self, client, admin_headers, db_session, admin_user):
        text_question = create_test_question(db_session, qtype="text", max_score=5, title="Essay Question")
        exam = create_test_exam(db_session, admin_id=admin_user.id, questions=[text_question], is_published=True)
        student = create_test_user(db_session, role="student", email="manual_grade@example.com")
        student_exam = create_test_student_exam(
            db_session,
            exam_id=exam.id,
            student_id=student.id,
            status=ExamStatus.SUBMITTED,
        )
        answer = StudentAnswer(
            student_exam_id=student_exam.id,
            question_id=text_question.id,
            answer_value={"text": "Essay response"},
        )
        db_session.add(answer)
        db_session.commit()

        resp = client.post(
            f"/api/admin/student-answers/{answer.id}/grade",
            json={"score": 4, "feedback": "Great work"},
            headers=admin_headers,
        )

        assert resp.status_code == status.HTTP_200_OK and resp.json()["score"] == 4
