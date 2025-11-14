from datetime import datetime, timezone, timedelta
from types import SimpleNamespace
from uuid import uuid4
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_ping_exam_routes():
    response = client.get("/api/admin/exams")
    assert response.status_code in (200, 401)
