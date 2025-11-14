from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException, status

from src.models.user import User, UserRole
from src.utils import dependencies


class _DummySession:
    def __init__(self, user):
        self._user = user

    def query(self, *_):
        return self

    def filter(self, *_):
        return self

    def first(self):
        return self._user


class TestGetCurrentUser:
    def test_returns_user_when_token_valid(self, monkeypatch):
        user = MagicMock(spec=User)
        session = _DummySession(user)
        monkeypatch.setattr(dependencies, "decode_access_token", lambda token: {"sub": "user@example.com"})

        result = dependencies.get_current_user(token="token", db=session)

        assert result is user

    def test_raises_when_payload_missing(self, monkeypatch):
        session = _DummySession(user=None)
        monkeypatch.setattr(dependencies, "decode_access_token", lambda token: None)

        with pytest.raises(HTTPException) as exc:
            dependencies.get_current_user(token="token", db=session)

        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED

    def test_raises_when_user_not_found(self, monkeypatch):
        session = _DummySession(user=None)
        monkeypatch.setattr(dependencies, "decode_access_token", lambda token: {"sub": "user@example.com"})

        with pytest.raises(HTTPException) as exc:
            dependencies.get_current_user(token="token", db=session)

        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED


class TestRoleDependencies:
    def test_get_current_admin_blocks_non_admin(self):
        current_user = MagicMock(spec=User)
        current_user.role = UserRole.STUDENT

        with pytest.raises(HTTPException) as exc:
            dependencies.get_current_admin(current_user=current_user)

        assert exc.value.status_code == status.HTTP_403_FORBIDDEN

    def test_get_current_student_blocks_non_student(self):
        current_user = MagicMock(spec=User)
        current_user.role = UserRole.ADMIN

        with pytest.raises(HTTPException) as exc:
            dependencies.get_current_student(current_user=current_user)

        assert exc.value.status_code == status.HTTP_403_FORBIDDEN
