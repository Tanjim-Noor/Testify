"""Service-layer regression tests to boost coverage across exam, answer, results,
and student exam services."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import cast
from uuid import UUID, uuid4

import pytest

from src.models.exam import Exam
from src.models.exam_question import ExamQuestion
from src.models.student_answer import StudentAnswer
from src.models.student_exam import ExamStatus
from src.schemas.exam import ExamCreate, ExamUpdate, ExamQuestionAssignment
from src.schemas.student_exam import AnswerSubmission
from src.services import answer_service, exam_service, results_service, student_exam_service
from tests.helpers import (
    create_test_exam,
    create_test_question,
    create_test_student_exam,
    create_test_user,
)


@pytest.fixture
def exam_with_questions(db_session, admin_user):
    """Provision an exam with two assigned questions."""

    questions = [
        create_test_question(db_session, qtype="single_choice", title="Single"),
        create_test_question(db_session, qtype="multi_choice", title="Multi"),
    ]
    exam = create_test_exam(db_session, admin_id=admin_user.id, questions=questions, is_published=True)
    return {"exam": exam, "questions": questions}


@pytest.fixture
def graded_exam_context(db_session, admin_user):
    """Create an exam with multiple students and answers for results tests."""

    q1 = create_test_question(db_session, qtype="single_choice", max_score=2)
    q2 = create_test_question(db_session, qtype="multi_choice", max_score=3)
    exam = create_test_exam(db_session, admin_id=admin_user.id, questions=[q1, q2], is_published=True)

    primary_student = create_test_user(db_session, role="student", email="primary@example.com")
    primary_session = create_test_student_exam(db_session, exam_id=exam.id, student_id=primary_student.id)
    setattr(primary_session, "status", ExamStatus.SUBMITTED)
    setattr(primary_session, "total_score", 4.0)
    setattr(primary_session, "submitted_at", datetime.now(timezone.utc))
    db_session.commit()
    db_session.refresh(primary_session)

    answers = [
        StudentAnswer(
            student_exam_id=primary_session.id,
            question_id=q1.id,
            answer_value={"selected": "Option B"},
            is_correct=True,
            score=2.0,
        ),
        StudentAnswer(
            student_exam_id=primary_session.id,
            question_id=q2.id,
            answer_value={"selected": ["Option A"]},
            is_correct=False,
            score=2.0,
        ),
    ]
    db_session.add_all(answers)
    db_session.commit()

    secondary_student = create_test_user(db_session, role="student", email="secondary@example.com")
    secondary_session = create_test_student_exam(db_session, exam_id=exam.id, student_id=secondary_student.id)
    setattr(secondary_session, "status", ExamStatus.SUBMITTED)
    setattr(secondary_session, "total_score", 3.0)
    setattr(secondary_session, "submitted_at", datetime.now(timezone.utc))
    db_session.commit()

    pending_student = create_test_user(db_session, role="student", email="pending@example.com")
    pending_session = create_test_student_exam(db_session, exam_id=exam.id, student_id=pending_student.id)
    setattr(pending_session, "status", ExamStatus.IN_PROGRESS)
    db_session.commit()

    return {
        "exam": exam,
        "primary_student": primary_student,
        "primary_session": primary_session,
        "secondary_session": secondary_session,
        "pending_session": pending_session,
        "questions": [q1, q2],
    }


@pytest.fixture
def expired_session_context(db_session, admin_user, student_user):
    """Student exam started well in the past so it should expire immediately."""

    question = create_test_question(db_session, qtype="single_choice")
    exam = create_test_exam(
        db_session,
        admin_id=admin_user.id,
        questions=[question],
        is_published=True,
        duration_minutes=1,
    )
    session = create_test_student_exam(db_session, exam_id=exam.id, student_id=student_user.id)
    setattr(session, "started_at", datetime.now(timezone.utc) - timedelta(minutes=5))
    db_session.commit()
    db_session.refresh(session)
    return {"exam": exam, "student_exam": session, "question": question}


@pytest.fixture
def in_progress_session_context(db_session, admin_user, student_user):
    """Student exam currently in progress with one assigned question."""

    question = create_test_question(db_session, qtype="single_choice")
    exam = create_test_exam(
        db_session,
        admin_id=admin_user.id,
        questions=[question],
        is_published=True,
        duration_minutes=5,
    )
    session = create_test_student_exam(db_session, exam_id=exam.id, student_id=student_user.id)
    setattr(session, "started_at", datetime.now(timezone.utc) - timedelta(seconds=30))
    db_session.commit()
    db_session.refresh(session)
    return {"exam": exam, "student_exam": session, "question": question, "student": student_user}


class TestExamServiceOperations:
    def test_create_exam_persists_record(self, db_session, admin_user):
        start = datetime.now(timezone.utc)
        payload = ExamCreate(
            title="Coverage Exam",
            description="Ensures create_exam path is exercised",
            start_time=start,
            end_time=start + timedelta(hours=1),
            duration_minutes=45,
        )

        created = exam_service.create_exam(db_session, payload, admin_user.id)

        assert str(created.title) == "Coverage Exam"

    def test_create_exam_rejects_invalid_window(self, db_session, admin_user):
        start = datetime.now(timezone.utc)
        invalid_payload = ExamCreate.model_construct(  # bypass validation intentionally
            title="Invalid",
            description="bad window",
            start_time=start,
            end_time=start - timedelta(minutes=15),
            duration_minutes=30,
        )

        with pytest.raises(ValueError):
            exam_service.create_exam(db_session, invalid_payload, admin_user.id)

    def test_assign_questions_requires_existing_records(self, db_session, admin_user):
        exam = create_test_exam(db_session, admin_id=admin_user.id, questions=[], is_published=False)
        assignments = [ExamQuestionAssignment(question_id=uuid4(), order_index=0)]
        exam_id = cast(UUID, exam.id)

        with pytest.raises(ValueError):
            exam_service.assign_questions(db_session, exam_id, assignments)

    def test_publish_exam_requires_questions(self, db_session, admin_user):
        exam = create_test_exam(db_session, admin_id=admin_user.id, questions=[], is_published=False)
        exam_id = cast(UUID, exam.id)

        with pytest.raises(ValueError):
            exam_service.publish_exam(db_session, exam_id, True)

    def test_reorder_questions_updates_order_indices(self, db_session, exam_with_questions):
        exam = exam_with_questions["exam"]
        questions = exam_with_questions["questions"]
        new_order = [cast(UUID, questions[1].id), cast(UUID, questions[0].id)]
        exam_id = cast(UUID, exam.id)

        result = exam_service.reorder_questions(db_session, exam_id, new_order)

        reordered = (
            db_session.query(ExamQuestion)
            .filter(ExamQuestion.exam_id == exam.id)
            .order_by(ExamQuestion.order_index)
            .all()
        )
        observed_order = [entry.question_id for entry in reordered]

        assert result is True and observed_order == new_order

    def test_delete_exam_blocks_when_submissions_exist(self, db_session, admin_user, student_user):
        exam = create_test_exam(db_session, admin_id=admin_user.id, questions=[], is_published=True)
        create_test_student_exam(db_session, exam_id=exam.id, student_id=student_user.id)
        exam_id = cast(UUID, exam.id)

        with pytest.raises(ValueError):
            exam_service.delete_exam(db_session, exam_id)

    def test_delete_exam_removes_exam_when_unused(self, db_session, admin_user):
        exam = create_test_exam(db_session, admin_id=admin_user.id, questions=[], is_published=False)
        exam_id = cast(UUID, exam.id)

        deleted = exam_service.delete_exam(db_session, exam_id)

        assert deleted is True and db_session.query(Exam).filter(Exam.id == exam_id).first() is None

    def test_update_exam_blocked_after_students_start(self, db_session, admin_user, student_user):
        question = create_test_question(db_session)
        exam = create_test_exam(db_session, admin_id=admin_user.id, questions=[question], is_published=True)
        create_test_student_exam(db_session, exam_id=exam.id, student_id=student_user.id)
        exam_id = cast(UUID, exam.id)

        update_payload = ExamUpdate(
            title="Blocked Update",
            description=None,
            start_time=None,
            end_time=None,
            duration_minutes=None,
        )

        with pytest.raises(ValueError):
            exam_service.update_exam(db_session, exam_id, update_payload)


class TestAnswerService:
    def test_bulk_save_answers_requires_known_questions(self, db_session, in_progress_session_context):
        student_exam = in_progress_session_context["student_exam"]
        submissions = [AnswerSubmission(question_id=uuid4(), answer_value={"selected": "A"})]

        with pytest.raises(ValueError):
            answer_service.bulk_save_answers(db_session, student_exam.id, submissions)

    def test_bulk_save_answers_upserts_and_counts(self, db_session, in_progress_session_context):
        student_exam = in_progress_session_context["student_exam"]
        question = in_progress_session_context["question"]
        payload = [AnswerSubmission(question_id=cast(UUID, question.id), answer_value={"selected": "A"})]

        saved = answer_service.bulk_save_answers(db_session, student_exam.id, payload)
        updated = answer_service.bulk_save_answers(
            db_session,
            student_exam.id,
            [AnswerSubmission(question_id=cast(UUID, question.id), answer_value={"selected": "B"})],
        )

        stored = db_session.query(StudentAnswer).filter(StudentAnswer.student_exam_id == student_exam.id).first()

        assert saved == 1 and updated == 1 and stored.answer_value["selected"] == "B"

    def test_get_student_answers_returns_mapping(self, db_session, in_progress_session_context):
        student_exam = in_progress_session_context["student_exam"]
        question = in_progress_session_context["question"]
        answer_service.bulk_save_answers(
            db_session,
            student_exam.id,
            [AnswerSubmission(question_id=cast(UUID, question.id), answer_value={"selected": "C"})],
        )

        mapping = answer_service.get_student_answers(db_session, student_exam.id)

        assert mapping[question.id]["selected"] == "C"


class TestResultsService:
    def test_get_student_result_after_submission(self, db_session, graded_exam_context):
        ctx = graded_exam_context

        payload = results_service.get_student_result(db_session, ctx["primary_session"].id, ctx["primary_student"].id)

        assert payload["percentage"] is not None and payload["question_results"][0]["correct_answer"] is not None

    def test_get_student_result_rejects_other_students(self, db_session, graded_exam_context):
        ctx = graded_exam_context
        stranger = create_test_user(db_session, role="student", email="outsider@example.com")

        with pytest.raises(PermissionError):
            results_service.get_student_result(db_session, ctx["primary_session"].id, stranger.id)

    def test_get_student_exam_detail_returns_full_breakdown(self, db_session, graded_exam_context):
        ctx = graded_exam_context

        detail = results_service.get_student_exam_detail(db_session, ctx["primary_session"].id)

        assert detail["student_email"].endswith("example.com") and len(detail["question_results"]) == 2

    def test_get_exam_results_for_admin_aggregates_scores(self, db_session, graded_exam_context):
        ctx = graded_exam_context

        result = results_service.get_exam_results_for_admin(db_session, ctx["exam"].id)

        assert result["exam_summary"]["average_score"] == 3.5 and len(result["student_results"]) == 3

    def test_calculate_exam_statistics_reports_extremes(self, db_session, graded_exam_context):
        ctx = graded_exam_context

        stats = results_service.calculate_exam_statistics(db_session, ctx["exam"].id)

        assert stats["highest_score"] == 4.0 and stats["submission_count"] == 2


class TestStudentExamService:
    def test_check_and_expire_exam_marks_expired(self, db_session, expired_session_context):
        session = expired_session_context["student_exam"]

        expired = student_exam_service.check_and_expire_exam(db_session, session)

        assert expired is True and session.status == ExamStatus.EXPIRED

    def test_save_answer_rejects_completed_exam(self, db_session, in_progress_session_context):
        ctx = in_progress_session_context
        session = ctx["student_exam"]
        session.status = ExamStatus.SUBMITTED
        db_session.commit()

        with pytest.raises(ValueError):
            student_exam_service.save_answer(
                db_session,
                session.id,
                ctx["student"].id,
                AnswerSubmission(question_id=cast(UUID, ctx["question"].id), answer_value={"selected": "A"}),
            )

    def test_save_answer_prevents_expired_session(self, db_session, expired_session_context, student_user):
        ctx = expired_session_context

        with pytest.raises(ValueError):
            student_exam_service.save_answer(
                db_session,
                ctx["student_exam"].id,
                student_user.id,
                AnswerSubmission(question_id=cast(UUID, ctx["question"].id), answer_value={"selected": "A"}),
            )

    def test_save_answer_persists_new_record(self, db_session, in_progress_session_context):
        ctx = in_progress_session_context

        saved = student_exam_service.save_answer(
            db_session,
            ctx["student_exam"].id,
            ctx["student"].id,
            AnswerSubmission(question_id=cast(UUID, ctx["question"].id), answer_value={"selected": "D"}),
        )

        stored = (
            db_session.query(StudentAnswer)
            .filter(StudentAnswer.student_exam_id == ctx["student_exam"].id)
            .filter(StudentAnswer.question_id == ctx["question"].id)
            .first()
        )

        assert saved is True and stored.answer_value["selected"] == "D"

    def test_start_exam_resumes_existing_session(self, db_session, in_progress_session_context):
        ctx = in_progress_session_context
        session = ctx["student_exam"]

        resumed = student_exam_service.start_exam(db_session, cast(UUID, ctx["exam"].id), ctx["student"].id)

        assert resumed.id == session.id and getattr(resumed, "_resumed") is True

    def test_get_exam_session_returns_answers_map(self, db_session, in_progress_session_context):
        ctx = in_progress_session_context
        student_exam_service.save_answer(
            db_session,
            ctx["student_exam"].id,
            ctx["student"].id,
            AnswerSubmission(question_id=cast(UUID, ctx["question"].id), answer_value={"choice": "A"}),
        )

        result = student_exam_service.get_exam_session(db_session, ctx["student_exam"].id, ctx["student"].id)

        assert result["answers"][ctx["question"].id]["choice"] == "A" and result["time_remaining"] > 0
