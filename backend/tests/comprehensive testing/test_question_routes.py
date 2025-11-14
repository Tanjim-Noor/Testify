"""API tests for admin question routes."""
from __future__ import annotations

from uuid import UUID

from fastapi import status


class TestAdminQuestionRoutes:
    def _payload(self, title: str = "Route Question") -> dict:
        return {
            "title": title,
            "description": "Admin question route test",
            "complexity": "easy",
            "type": "single_choice",
            "options": ["A", "B"],
            "correct_answers": ["A"],
            "max_score": 1,
            "tags": ["routes", "admin"],
        }

    def test_question_crud_flow(self, client, admin_headers):
        create_resp = client.post("/api/admin/questions", json=self._payload(), headers=admin_headers)
        assert create_resp.status_code == status.HTTP_201_CREATED
        question_id = UUID(create_resp.json()["id"])

        list_resp = client.get(
            "/api/admin/questions",
            headers=admin_headers,
            params={"search": "Route", "complexity": "easy", "page": 1, "limit": 5},
        )
        payload = list_resp.json()
        assert list_resp.status_code == status.HTTP_200_OK and payload["total"] >= 1

        update_payload = self._payload("Updated via Route")
        update_resp = client.put(f"/api/admin/questions/{question_id}", json=update_payload, headers=admin_headers)
        assert update_resp.status_code == status.HTTP_200_OK
        assert update_resp.json()["title"] == "Updated via Route"

        delete_resp = client.delete(f"/api/admin/questions/{question_id}", headers=admin_headers)
        assert delete_resp.status_code == status.HTTP_200_OK

        missing_resp = client.get(f"/api/admin/questions/{question_id}", headers=admin_headers)
        assert missing_resp.status_code == status.HTTP_404_NOT_FOUND

        delete_again = client.delete(f"/api/admin/questions/{question_id}", headers=admin_headers)
        assert delete_again.status_code == status.HTTP_404_NOT_FOUND
