from types import SimpleNamespace
import pytest

from src.services.question_service import bulk_create_questions, process_excel_import
from src.schemas.question import ImportResult, ImportRowError


class DummyDB:
    def __init__(self):
        self.saved = []
        self.committed = False
        self.rollback_called = False

    def bulk_save_objects(self, objs):
        if getattr(self, "raise_on_save", False):
            raise RuntimeError("Simulated DB error")
        self.saved.extend(objs)

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rollback_called = True


def test_bulk_create_questions_success():
    db = DummyDB()
    questions = [
        {"title": "Q1", "description": "desc", "complexity": "easy", "type": "text", "correct_answers": [], "max_score": 1},
        {"title": "Q2", "description": "desc2", "complexity": "easy", "type": "text", "correct_answers": [], "max_score": 2},
    ]
    created = bulk_create_questions(questions, db)
    assert created == 2
    assert db.committed is True
    assert len(db.saved) == 2


def test_bulk_create_questions_db_error():
    db = DummyDB()
    db.raise_on_save = True
    with pytest.raises(RuntimeError):
        bulk_create_questions([{"title": "Q1", "complexity": "easy", "type": "text", "max_score": 1}], db)
    assert db.rollback_called is True


def test_process_excel_import_parse_error(tmp_path):
    # Use a bad path to ensure parse raises
    db = DummyDB()
    result = process_excel_import(str(tmp_path / "nonexistent.xlsx"), db)
    assert isinstance(result, ImportResult)
    # When parse fails entirely, we return an error row with row_number 0
    assert result.success_count == 0
    assert result.error_count == 1
    assert any(err.row_number == 0 for err in result.errors)
