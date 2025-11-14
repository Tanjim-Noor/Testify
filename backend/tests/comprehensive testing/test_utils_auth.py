"""Unit tests for src.utils.auth helpers."""
from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from jose import JWTError

from src.utils import auth


class TestAuthHelpers:
    def test_verify_password_round_trip(self):
        hashed = auth.get_password_hash("SecretPass123!")

        assert auth.verify_password("SecretPass123!", hashed) is True
        assert auth.verify_password("WrongPass", hashed) is False

    def test_verify_password_raises_when_bcrypt_fails(self, monkeypatch):
        monkeypatch.setattr(auth.bcrypt, "checkpw", MagicMock(side_effect=ValueError("oops")))

        with pytest.raises(Exception) as exc:
            auth.verify_password("secret", "hash")

        assert "Error verifying password" in str(exc.value)

    def test_create_and_decode_access_token(self):
        token = auth.create_access_token({"sub": "utility@example.com"})

        payload = auth.decode_access_token(token)

        assert payload["sub"] == "utility@example.com"

    def test_get_password_hash_raises_when_bcrypt_fails(self, monkeypatch):
        monkeypatch.setattr(auth.bcrypt, "hashpw", MagicMock(side_effect=ValueError("oops")))

        with pytest.raises(Exception) as exc:
            auth.get_password_hash("secret")

        assert "Error hashing password" in str(exc.value)

    def test_decode_access_token_invalid_signature(self):
        token = auth.create_access_token({"sub": "utility@example.com"})

        with pytest.raises(JWTError):
            auth.decode_access_token(token + "tamper")
