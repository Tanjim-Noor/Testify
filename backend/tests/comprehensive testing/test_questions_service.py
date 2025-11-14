"""Tests for question_service covering CRUD, filtering, and import orchestration."""
from __future__ import annotations

from uuid import UUID, uuid4

import pytest

from src.schemas.question import PaginationParams, QuestionCreate, QuestionFilter
from src.services import question_service
from tests.helpers import create_test_question


def _question_payload(title: str = "Service Question") -> QuestionCreate:
    return QuestionCreate(
        title=title,
        description="Service-layer test question",
        complexity="easy",
        type="single_choice",
        options=["A", "B"],
        correct_answers=["A"],
        max_score=2,
        tags=["math", "coverage"],
    )


class TestBulkCreate:
    def test_bulk_create_questions_inserts_records(self, db_session):
        rows = [
            {
                "title": "Bulk Q1",
                "description": "Desc",
                "complexity": "easy",
                "type": "single_choice",
                "options": ["A", "B"],
                "correct_answers": ["A"],
                "max_score": 1,
                "tags": ["math"],
            },
            {
                "title": "Bulk Q2",
                "description": "Desc",
                "complexity": "medium",
                "type": "multi_choice",
                "options": ["A", "B", "C"],
                "correct_answers": ["A", "C"],
                "max_score": 2,
                "tags": ["logic"],
            },
        ]

        created = question_service.bulk_create_questions(rows, db_session)

        assert created == 2

    def test_bulk_create_questions_no_payload_returns_zero(self, db_session):
        assert question_service.bulk_create_questions([], db_session) == 0


class TestQueryHelpers:
    def test_get_questions_applies_filters(self, db_session):
        create_test_question(db_session, qtype="single_choice", title="Easy Alpha")
        create_test_question(db_session, qtype="text", title="Hard Beta")
        filters = QuestionFilter(complexity="easy", search="Alpha")
        pagination = PaginationParams(page=1, limit=10)

        questions, total = question_service.get_questions(db_session, filters, pagination)

        assert total == 1 and questions[0].title == "Easy Alpha"

    def test_get_question_by_id_handles_missing(self, db_session):
        missing = question_service.get_question_by_id(db_session, uuid4())

        assert missing is None


class TestCrudOperations:
    def test_create_question_round_trip(self, db_session):
        payload = _question_payload("Create Round Trip")

        created = question_service.create_question(db_session, payload)

        assert str(created.title) == "Create Round Trip"

    def test_update_question_modifies_fields(self, db_session):
        original = question_service.create_question(db_session, _question_payload("Needs Update"))
        updated = question_service.update_question(db_session, UUID(str(original.id)), _question_payload("Updated Title"))

        assert updated is not None and str(updated.title) == "Updated Title"

    def test_update_question_returns_none_when_missing(self, db_session):
        updated = question_service.update_question(db_session, uuid4(), _question_payload("Missing"))

        assert updated is None

    def test_delete_question_handles_present_and_missing(self, db_session):
        question = question_service.create_question(db_session, _question_payload("Delete Target"))
        first = question_service.delete_question(db_session, UUID(str(question.id)))
        second = question_service.delete_question(db_session, UUID(str(question.id)))

        assert first is True and second is False


class TestImportErrorHandling:
    def test_process_excel_import_handles_parse_failure(self, db_session, monkeypatch, tmp_path):
        class FailingParser:
            def __init__(self, _file_path):
                self._file_path = _file_path

            def parse(self):
                raise ValueError("boom")

        monkeypatch.setattr(question_service, "QuestionExcelParser", FailingParser)

        result = question_service.process_excel_import(str(tmp_path / "missing.xlsx"), db_session)

        assert result.error_count == 1 and result.success_count == 0
