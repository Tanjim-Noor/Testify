from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_question_routes_available():
    response = client.get("/api/admin/questions")
    assert response.status_code in (200, 401)
