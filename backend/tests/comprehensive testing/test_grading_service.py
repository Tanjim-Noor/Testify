"""Unit tests for grading_service helpers and exam grading flow."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from src.models.student_answer import StudentAnswer
from src.models.student_exam import ExamStatus
from src.services import grading_service
from tests.helpers import (
    create_test_exam,
    create_test_question,
    create_test_student_exam,
    create_test_user,
)


class TestSingleChoiceGrading:
    def test_grade_single_choice_correct(self):
        is_correct, score = grading_service.grade_single_choice({"answer": "A"}, ["A"], 2)

        assert is_correct and score == 2

    def test_grade_single_choice_incorrect(self):
        is_correct, score = grading_service.grade_single_choice({"answer": "B"}, ["A"], 2)

        assert (not is_correct) and score == 0

    def test_grade_single_choice_empty(self):
        is_correct, score = grading_service.grade_single_choice({}, ["A"], 1)

        assert (not is_correct) and score == 0

    def test_grade_single_choice_case_insensitive(self):
        is_correct, score = grading_service.grade_single_choice({"answer": "a"}, ["A"], 1)

        assert is_correct and score == 1


class TestMultiChoiceGrading:
    def test_grade_multi_choice_exact_match(self):
        is_correct, score = grading_service.grade_multi_choice({"answers": ["A", "B"]}, ["A", "B"], 3)

        assert is_correct and score == 3

    def test_grade_multi_choice_partial(self):
        is_correct, score = grading_service.grade_multi_choice({"answers": ["A"]}, ["A", "B"], 3)

        assert (not is_correct) and score == 0

    def test_grade_multi_choice_missing_answer(self):
        is_correct, score = grading_service.grade_multi_choice({"answers": []}, ["A", "B"], 3)

        assert (not is_correct) and score == 0

    def test_grade_multi_choice_extra_answer(self):
        is_correct, score = grading_service.grade_multi_choice({"answers": ["A", "B", "C"]}, ["A", "B"], 3)

        assert (not is_correct) and score == 0

    def test_grade_multi_choice_order_independent(self):
        is_correct, score = grading_service.grade_multi_choice({"answers": ["B", "A"]}, ["A", "B"], 3)

        assert is_correct and score == 3


class TestExamGrading:
    def _setup_exam(self, db_session, include_text: bool = False):
        admin = create_test_user(db_session, role="admin")
        student = create_test_user(db_session, role="student")
        questions = [
            create_test_question(db_session, qtype="single_choice", max_score=2),
            create_test_question(db_session, qtype="multi_choice", max_score=3),
        ]
        if include_text:
            questions.append(create_test_question(db_session, qtype="text", max_score=5))
        exam = create_test_exam(db_session, admin_id=admin.id, questions=questions, is_published=True)
        student_exam = create_test_student_exam(
            db_session,
            exam_id=exam.id,
            student_id=student.id,
            status=ExamStatus.SUBMITTED,
            started_at=datetime.now(timezone.utc) - timedelta(minutes=10),
        )
        return exam, student_exam, student

    def test_grade_exam_all_objective(self, db_session):
        """Ensure fully objective exams award the sum of all question scores."""
        exam, student_exam, _ = self._setup_exam(db_session)
        questions = [eq.question for eq in exam.exam_questions]
        answers = [
            StudentAnswer(student_exam_id=student_exam.id, question_id=questions[0].id, answer_value={"answer": questions[0].correct_answers[0]}),
            StudentAnswer(student_exam_id=student_exam.id, question_id=questions[1].id, answer_value={"answers": questions[1].correct_answers}),
        ]
        db_session.add_all(answers)
        db_session.commit()

        total = grading_service.grade_student_exam(db_session, UUID(str(student_exam.id)))

        assert total == sum(q.max_score for q in questions)

    def test_grade_exam_mixed_types(self, db_session):
        """Validate manual question scores are preserved when auto-grading."""
        exam, student_exam, _ = self._setup_exam(db_session, include_text=True)
        questions = [eq.question for eq in exam.exam_questions]
        db_session.add_all([
            StudentAnswer(student_exam_id=student_exam.id, question_id=questions[0].id, answer_value={"answer": questions[0].correct_answers[0]}),
            StudentAnswer(student_exam_id=student_exam.id, question_id=questions[1].id, answer_value={"answers": questions[1].correct_answers}),
            StudentAnswer(student_exam_id=student_exam.id, question_id=questions[2].id, answer_value={"text": "Essay"}, score=4.0),
        ])
        db_session.commit()

        total = grading_service.grade_student_exam(db_session, UUID(str(student_exam.id)))

        assert total == questions[0].max_score + questions[1].max_score + 4.0

    def test_grade_exam_calculate_total(self, db_session):
        exam, student_exam, _ = self._setup_exam(db_session)
        question = exam.exam_questions[0].question
        db_session.add(StudentAnswer(student_exam_id=student_exam.id, question_id=question.id, answer_value={"answer": question.correct_answers[0]}))
        db_session.commit()

        grading_service.grade_student_exam(db_session, UUID(str(student_exam.id)))

        db_session.refresh(student_exam)
        assert student_exam.total_score == question.max_score