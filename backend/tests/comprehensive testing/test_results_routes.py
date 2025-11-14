"""API-level tests for student/admin results endpoints."""
from __future__ import annotations

from datetime import datetime, timezone

import pytest

from src.models.student_answer import StudentAnswer
from src.models.student_exam import ExamStatus
from tests.helpers import (
    create_test_exam,
    create_test_question,
    create_test_student_exam,
    create_test_user,
)


@pytest.fixture
def completed_exam_context(db_session, admin_user, student_user):
    question = create_test_question(db_session, qtype="single_choice", max_score=2, title="Results Question")
    exam = create_test_exam(db_session, admin_id=admin_user.id, questions=[question], is_published=True)
    student_exam = create_test_student_exam(db_session, exam_id=exam.id, student_id=student_user.id)
    setattr(student_exam, "status", ExamStatus.SUBMITTED)
    setattr(student_exam, "total_score", float(question.max_score))
    setattr(student_exam, "submitted_at", datetime.now(timezone.utc))
    db_session.add(
        StudentAnswer(
            student_exam_id=student_exam.id,
            question_id=question.id,
            answer_value={"answer": question.correct_answers[0]},
            is_correct=True,
            score=float(question.max_score),
        )
    )
    db_session.commit()

    # Additional student exam to populate admin aggregate endpoints
    other_student = create_test_user(db_session, role="student", email="results_other@example.com")
    other_exam = create_test_student_exam(db_session, exam_id=exam.id, student_id=other_student.id)
    setattr(other_exam, "status", ExamStatus.EXPIRED)
    setattr(other_exam, "total_score", 0.0)
    db_session.commit()

    return {
        "exam": exam,
        "question": question,
        "student_exam": student_exam,
        "student_user": student_user,
    }


class TestStudentResultRoutes:
    def test_student_can_fetch_result_by_id(self, client, student_headers, completed_exam_context):
        student_exam = completed_exam_context["student_exam"]

        response = client.get(f"/api/student/results/{student_exam.id}", headers=student_headers)

        assert response.status_code == 200 and response.json()["student_exam_id"] == str(student_exam.id)

    def test_student_get_result_by_exam(self, client, student_headers, completed_exam_context):
        exam = completed_exam_context["exam"]

        response = client.get(f"/api/student/results/exam/{exam.id}", headers=student_headers)

        assert response.status_code == 200 and response.json()["exam_title"] == exam.title


class TestAdminResultRoutes:
    def test_admin_get_exam_results(self, client, admin_headers, completed_exam_context):
        exam = completed_exam_context["exam"]

        response = client.get(f"/api/admin/results/exams/{exam.id}", headers=admin_headers)

        assert response.status_code == 200 and response.json()["exam_summary"]["exam_id"] == str(exam.id)

    def test_admin_get_student_exam_detail(self, client, admin_headers, completed_exam_context):
        student_exam = completed_exam_context["student_exam"]

        response = client.get(f"/api/admin/results/student-exams/{student_exam.id}", headers=admin_headers)

        assert response.status_code == 200 and response.json()["student_exam_id"] == str(student_exam.id)

    def test_admin_exam_statistics(self, client, admin_headers, completed_exam_context):
        exam = completed_exam_context["exam"]

        response = client.get(f"/api/admin/results/exams/{exam.id}/statistics", headers=admin_headers)

        assert response.status_code == 200 and response.json()["total_students"] >= 1

    def test_admin_get_all_exams_for_student(self, client, admin_headers, completed_exam_context):
        student = completed_exam_context["student_user"]

        response = client.get(f"/api/admin/results/students/{student.id}/exams", headers=admin_headers)

        assert response.status_code == 200 and len(response.json()) >= 1
