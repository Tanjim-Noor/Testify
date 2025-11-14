from unittest.mock import MagicMock

import pytest

from src.config import database


class TestGetDbDependency:
    def test_get_db_yields_session_and_closes(self, monkeypatch):
        session_mock = MagicMock()
        session_local_mock = MagicMock(return_value=session_mock)
        monkeypatch.setattr(database, "SessionLocal", session_local_mock)

        generator = database.get_db()
        db_session = next(generator)

        assert db_session is session_mock
        with pytest.raises(StopIteration):
            next(generator)

        session_mock.close.assert_called_once()
        session_mock.rollback.assert_not_called()

    def test_get_db_rolls_back_on_exception(self, monkeypatch):
        session_mock = MagicMock()
        session_local_mock = MagicMock(return_value=session_mock)
        monkeypatch.setattr(database, "SessionLocal", session_local_mock)

        generator = database.get_db()
        next(generator)

        with pytest.raises(RuntimeError):
            generator.throw(RuntimeError("boom"))

        session_mock.rollback.assert_called_once()
        session_mock.close.assert_called_once()
