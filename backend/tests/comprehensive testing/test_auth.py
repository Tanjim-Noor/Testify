"""Authentication API tests covering registration, login, and role guards."""
from __future__ import annotations

from src.models.user import User
from tests.helpers import DEFAULT_TEST_PASSWORD, create_test_user, get_auth_headers


class TestRegistration:
    def test_register_user_success(self, client, db_session):
        payload = {"email": "new_user@example.com", "password": "Pass123!", "role": "student"}

        response = client.post("/api/auth/register", json=payload)

        assert response.status_code == 201
        created = db_session.query(User).filter_by(email=payload["email"]).first()
        assert created is not None

    def test_register_user_duplicate_email(self, client, db_session):
        create_test_user(db_session, role="student", email="dup@example.com")
        payload = {"email": "dup@example.com", "password": "Pass123!", "role": "student"}

        response = client.post("/api/auth/register", json=payload)

        assert response.status_code == 409

    def test_register_user_invalid_data(self, client):
        response = client.post("/api/auth/register", json={"password": "x", "role": "student"})

        assert response.status_code == 422


class TestLogin:
    def test_login_success(self, client, db_session):
        user = create_test_user(db_session, role="student", email="login@example.com", password="TopSecret1!")

        response = client.post("/api/auth/login", data={"username": user.email, "password": "TopSecret1!"})

        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_login_invalid_credentials(self, client, db_session):
        user = create_test_user(db_session, role="student", email="wrongpass@example.com", password=DEFAULT_TEST_PASSWORD)

        response = client.post("/api/auth/login", data={"username": user.email, "password": "bad-pass"})

        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        response = client.post("/api/auth/login", data={"username": "ghost@example.com", "password": "doesntmatter"})

        assert response.status_code == 401


class TestCurrentUser:
    def test_get_current_user_with_token(self, client, admin_user, admin_token):
        headers = get_auth_headers(admin_token)

        response = client.get("/api/auth/me", headers=headers)

        assert response.status_code == 200
        assert response.json()["email"] == admin_user.email

    def test_get_current_user_without_token(self, client):
        response = client.get("/api/auth/me")

        assert response.status_code == 401

    def test_get_current_user_invalid_token(self, client):
        response = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid"})

        assert response.status_code == 401


class TestRoleGuards:
    def test_admin_only_endpoint(self, client, admin_headers, student_headers, sample_exam):
        ok_response = client.get("/api/admin/exams", headers=admin_headers)
        forbidden = client.get("/api/admin/exams", headers=student_headers)

        assert ok_response.status_code == 200
        assert forbidden.status_code == 403

    def test_student_only_endpoint(self, client, student_headers, admin_headers):
        response = client.get("/api/student/exams", headers=student_headers)

        assert response.status_code == 200

        forbidden = client.get("/api/student/exams", headers=admin_headers)
        assert forbidden.status_code == 403
