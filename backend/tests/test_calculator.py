"""Unit and integration tests for calculator endpoints"""
import pytest


class TestCalculatorSessions:
    """Tests for session management"""

    def test_create_session(self, client, auth_headers):
        """Test creating a new session"""
        headers, email = auth_headers
        response = client.post(
            "/api/v1/sessions",
            json={"name": "Test Session"},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Session"
        assert "id" in data
        assert "created_at" in data

    def test_create_multiple_sessions(self, client, auth_headers):
        """Test creating multiple sessions"""
        headers, _ = auth_headers
        for i in range(3):
            response = client.post(
                "/api/v1/sessions",
                json={"name": f"Session {i+1}"},
                headers=headers
            )
            assert response.status_code == 200

        # Verify all sessions exist
        response = client.get("/api/v1/sessions", headers=headers)
        assert response.status_code == 200
        assert len(response.json()) == 3

    def test_get_sessions(self, client, auth_headers):
        """Test getting all sessions for a user"""
        headers, _ = auth_headers
        client.post("/api/v1/sessions", json={"name": "Session 1"}, headers=headers)
        client.post("/api/v1/sessions", json={"name": "Session 2"}, headers=headers)

        response = client.get("/api/v1/sessions", headers=headers)
        assert response.status_code == 200
        sessions = response.json()
        assert len(sessions) == 2

    def test_get_sessions_empty(self, client, auth_headers):
        """Test getting sessions when none exist"""
        headers, _ = auth_headers
        response = client.get("/api/v1/sessions", headers=headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_get_sessions_requires_auth(self, client):
        """Test that getting sessions requires authentication"""
        response = client.get("/api/v1/sessions")
        assert response.status_code == 401

    def test_rename_session(self, client, auth_headers):
        """Test renaming a session"""
        headers, _ = auth_headers
        create_response = client.post(
            "/api/v1/sessions",
            json={"name": "Original Name"},
            headers=headers
        )
        session_id = create_response.json()["id"]

        response = client.patch(
            f"/api/v1/sessions/{session_id}",
            json={"name": "New Name"},
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["name"] == "New Name"

    def test_rename_nonexistent_session(self, client, auth_headers):
        """Test renaming a non-existent session"""
        headers, _ = auth_headers
        response = client.patch(
            "/api/v1/sessions/99999",
            json={"name": "New Name"},
            headers=headers
        )
        assert response.status_code == 404

    def test_rename_session_wrong_user(self, client, auth_headers, second_auth_headers):
        """Test that user cannot rename another user's session"""
        headers1, _ = auth_headers
        headers2 = second_auth_headers

        # User 1 creates session
        create_response = client.post(
            "/api/v1/sessions",
            json={"name": "User1 Session"},
            headers=headers1
        )
        session_id = create_response.json()["id"]

        # User 2 tries to rename it
        response = client.patch(
            f"/api/v1/sessions/{session_id}",
            json={"name": "Hijacked"},
            headers=headers2
        )
        assert response.status_code == 404

    def test_delete_session(self, client, auth_headers):
        """Test deleting a session"""
        headers, _ = auth_headers
        create_response = client.post(
            "/api/v1/sessions",
            json={"name": "To Delete"},
            headers=headers
        )
        session_id = create_response.json()["id"]

        response = client.delete(f"/api/v1/sessions/{session_id}", headers=headers)
        assert response.status_code == 200

        # Verify deleted
        sessions = client.get("/api/v1/sessions", headers=headers).json()
        assert all(s["id"] != session_id for s in sessions)

    def test_delete_nonexistent_session(self, client, auth_headers):
        """Test deleting a non-existent session"""
        headers, _ = auth_headers
        response = client.delete("/api/v1/sessions/99999", headers=headers)
        assert response.status_code == 404


class TestCalculatorCalculate:
    """Tests for calculation functionality"""

    def test_basic_addition(self, client, auth_headers):
        """Test basic addition"""
        headers, _ = auth_headers
        session = client.post("/api/v1/sessions", json={"name": "Calc"}, headers=headers).json()

        response = client.post(
            "/api/v1/calculate",
            json={"expression": "2 + 2", "session_id": session["id"]},
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["result"] == "4"

    def test_basic_subtraction(self, client, auth_headers):
        """Test basic subtraction"""
        headers, _ = auth_headers
        session = client.post("/api/v1/sessions", json={"name": "Calc"}, headers=headers).json()

        response = client.post(
            "/api/v1/calculate",
            json={"expression": "10 - 3", "session_id": session["id"]},
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["result"] == "7"

    def test_basic_multiplication(self, client, auth_headers):
        """Test basic multiplication"""
        headers, _ = auth_headers
        session = client.post("/api/v1/sessions", json={"name": "Calc"}, headers=headers).json()

        response = client.post(
            "/api/v1/calculate",
            json={"expression": "6 * 7", "session_id": session["id"]},
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["result"] == "42"

    def test_basic_division(self, client, auth_headers):
        """Test basic division"""
        headers, _ = auth_headers
        session = client.post("/api/v1/sessions", json={"name": "Calc"}, headers=headers).json()

        response = client.post(
            "/api/v1/calculate",
            json={"expression": "20 / 4", "session_id": session["id"]},
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["result"] == "5.0"

    def test_complex_expression(self, client, auth_headers):
        """Test complex expression with order of operations"""
        headers, _ = auth_headers
        session = client.post("/api/v1/sessions", json={"name": "Calc"}, headers=headers).json()

        response = client.post(
            "/api/v1/calculate",
            json={"expression": "2 + 3 * 4", "session_id": session["id"]},
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["result"] == "14"

    def test_expression_with_parens(self, client, auth_headers):
        """Test expression with parentheses"""
        headers, _ = auth_headers
        session = client.post("/api/v1/sessions", json={"name": "Calc"}, headers=headers).json()

        response = client.post(
            "/api/v1/calculate",
            json={"expression": "(2 + 3) * 4", "session_id": session["id"]},
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["result"] == "20"

    def test_decimal_result(self, client, auth_headers):
        """Test division with decimal result"""
        headers, _ = auth_headers
        session = client.post("/api/v1/sessions", json={"name": "Calc"}, headers=headers).json()

        response = client.post(
            "/api/v1/calculate",
            json={"expression": "7 / 2", "session_id": session["id"]},
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["result"] == "3.5"

    def test_invalid_expression_syntax(self, client, auth_headers):
        """Test invalid expression syntax"""
        headers, _ = auth_headers
        session = client.post("/api/v1/sessions", json={"name": "Calc"}, headers=headers).json()

        response = client.post(
            "/api/v1/calculate",
            json={"expression": "2 +", "session_id": session["id"]},
            headers=headers
        )
        assert response.status_code == 400

    def test_invalid_expression_chars(self, client, auth_headers):
        """Test expression with invalid characters (security)"""
        headers, _ = auth_headers
        session = client.post("/api/v1/sessions", json={"name": "Calc"}, headers=headers).json()

        response = client.post(
            "/api/v1/calculate",
            json={"expression": "import os", "session_id": session["id"]},
            headers=headers
        )
        assert response.status_code == 400
        assert "Invalid characters" in response.json()["detail"]

    def test_calculate_requires_auth(self, client):
        """Test that calculation requires authentication"""
        response = client.post(
            "/api/v1/calculate",
            json={"expression": "2 + 2", "session_id": 1}
        )
        assert response.status_code == 401

    def test_calculate_wrong_session(self, client, auth_headers, second_auth_headers):
        """Test that user cannot calculate in another user's session"""
        headers1, _ = auth_headers
        headers2 = second_auth_headers

        # User 1 creates session
        session = client.post("/api/v1/sessions", json={"name": "User1"}, headers=headers1).json()

        # User 2 tries to calculate in it
        response = client.post(
            "/api/v1/calculate",
            json={"expression": "2 + 2", "session_id": session["id"]},
            headers=headers2
        )
        assert response.status_code == 404


class TestCalculatorHistory:
    """Tests for calculation history"""

    def test_get_history_empty(self, client, auth_headers):
        """Test getting empty history"""
        headers, _ = auth_headers
        session = client.post("/api/v1/sessions", json={"name": "Calc"}, headers=headers).json()

        response = client.get(f"/api/v1/history/{session['id']}", headers=headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_get_history_after_calculation(self, client, auth_headers):
        """Test getting history after calculations"""
        headers, _ = auth_headers
        session = client.post("/api/v1/sessions", json={"name": "Calc"}, headers=headers).json()

        # Do calculations
        client.post(
            "/api/v1/calculate",
            json={"expression": "2 + 2", "session_id": session["id"]},
            headers=headers
        )
        client.post(
            "/api/v1/calculate",
            json={"expression": "5 * 3", "session_id": session["id"]},
            headers=headers
        )

        response = client.get(f"/api/v1/history/{session['id']}", headers=headers)
        assert response.status_code == 200
        history = response.json()
        assert len(history) == 2

    def test_history_ordered_by_newest_first(self, client, auth_headers):
        """Test that history is ordered by newest first"""
        headers, _ = auth_headers
        session = client.post("/api/v1/sessions", json={"name": "Calc"}, headers=headers).json()

        client.post(
            "/api/v1/calculate",
            json={"expression": "1 + 1", "session_id": session["id"]},
            headers=headers
        )
        client.post(
            "/api/v1/calculate",
            json={"expression": "2 + 2", "session_id": session["id"]},
            headers=headers
        )

        response = client.get(f"/api/v1/history/{session['id']}", headers=headers)
        history = response.json()
        assert history[0]["expression"] == "2 + 2"
        assert history[1]["expression"] == "1 + 1"

    def test_history_contains_expression_and_result(self, client, auth_headers):
        """Test that history items contain expression and result"""
        headers, _ = auth_headers
        session = client.post("/api/v1/sessions", json={"name": "Calc"}, headers=headers).json()

        client.post(
            "/api/v1/calculate",
            json={"expression": "10 + 5", "session_id": session["id"]},
            headers=headers
        )

        response = client.get(f"/api/v1/history/{session['id']}", headers=headers)
        item = response.json()[0]
        assert item["expression"] == "10 + 5"
        assert item["result"] == "15"
        assert "id" in item
        assert "created_at" in item

    def test_delete_history_item(self, client, auth_headers):
        """Test deleting a history item"""
        headers, _ = auth_headers
        session = client.post("/api/v1/sessions", json={"name": "Calc"}, headers=headers).json()

        calc_response = client.post(
            "/api/v1/calculate",
            json={"expression": "2 + 2", "session_id": session["id"]},
            headers=headers
        )

        history = client.get(f"/api/v1/history/{session['id']}", headers=headers).json()
        item_id = history[0]["id"]

        response = client.delete(f"/api/v1/history/{item_id}", headers=headers)
        assert response.status_code == 200

        # Verify deleted
        remaining = client.get(f"/api/v1/history/{session['id']}", headers=headers).json()
        assert len(remaining) == 0

    def test_delete_history_wrong_user(self, client, auth_headers, second_auth_headers):
        """Test that user cannot delete another user's history"""
        headers1, _ = auth_headers
        headers2 = second_auth_headers

        session = client.post("/api/v1/sessions", json={"name": "Calc"}, headers=headers1).json()

        client.post(
            "/api/v1/calculate",
            json={"expression": "2 + 2", "session_id": session["id"]},
            headers=headers1
        )

        history = client.get(f"/api/v1/history/{session['id']}", headers=headers1).json()
        item_id = history[0]["id"]

        # User 2 tries to delete
        response = client.delete(f"/api/v1/history/{item_id}", headers=headers2)
        assert response.status_code == 404

    def test_history_requires_auth(self, client):
        """Test that history requires authentication"""
        response = client.get("/api/v1/history/1")
        assert response.status_code == 401


class TestCalculatorIntegration:
    """Integration tests for full calculator workflows"""

    def test_full_calculation_workflow(self, client, auth_headers):
        """Test complete workflow: create session, calculate, view history"""
        headers, _ = auth_headers

        # Create session
        session_response = client.post(
            "/api/v1/sessions",
            json={"name": "Budget Planning"},
            headers=headers
        )
        session_id = session_response.json()["id"]

        # Calculate multiple expressions
        calculations = [
            ("100 + 50", "150"),
            ("200 - 75", "125"),
            ("15 * 4", "60"),
        ]

        for expr, expected in calculations:
            calc_response = client.post(
                "/api/v1/calculate",
                json={"expression": expr, "session_id": session_id},
                headers=headers
            )
            assert calc_response.status_code == 200
            assert calc_response.json()["result"] == expected

        # Verify history
        history_response = client.get(
            f"/api/v1/history/{session_id}",
            headers=headers
        )
        assert history_response.status_code == 200
        assert len(history_response.json()) == 3

        # Rename session
        rename_response = client.patch(
            f"/api/v1/sessions/{session_id}",
            json={"name": "Updated Budget"},
            headers=headers
        )
        assert rename_response.json()["name"] == "Updated Budget"

        # Delete history item
        history = history_response.json()
        delete_response = client.delete(
            f"/api/v1/history/{history[0]['id']}",
            headers=headers
        )
        assert delete_response.status_code == 200

        # Verify deletion
        remaining_history = client.get(
            f"/api/v1/history/{session_id}",
            headers=headers
        ).json()
        assert len(remaining_history) == 2

    def test_multiple_sessions_isolation(self, client, auth_headers):
        """Test that sessions are isolated between users"""
        import uuid
        headers1, _ = auth_headers

        # Create second user
        email2 = f"user2_{uuid.uuid4().hex[:8]}@example.com"
        client.post("/api/v1/auth/signup", json={"email": email2, "password": "pass123"})
        login2 = client.post("/api/v1/auth/access", json={"email": email2, "password": "pass123"})
        headers2 = {"Authorization": f"Bearer {login2.json()['access_token']}"}

        # User 1 creates session
        session1 = client.post(
            "/api/v1/sessions",
            json={"name": "User1 Session"},
            headers=headers1
        ).json()

        # User 2 creates session
        session2 = client.post(
            "/api/v1/sessions",
            json={"name": "User2 Session"},
            headers=headers2
        ).json()

        # User 1 calculates in their session
        client.post(
            "/api/v1/calculate",
            json={"expression": "100 + 100", "session_id": session1["id"]},
            headers=headers1
        )

        # User 2 calculates in their session
        client.post(
            "/api/v1/calculate",
            json={"expression": "50 + 50", "session_id": session2["id"]},
            headers=headers2
        )

        # Verify isolation
        history1 = client.get(
            f"/api/v1/history/{session1['id']}",
            headers=headers1
        ).json()
        history2 = client.get(
            f"/api/v1/history/{session2['id']}",
            headers=headers2
        ).json()

        assert len(history1) == 1
        assert len(history2) == 1
        assert history1[0]["result"] == "200"
        assert history2[0]["result"] == "100"

        # Verify each user only sees their sessions
        sessions1 = client.get("/api/v1/sessions", headers=headers1).json()
        sessions2 = client.get("/api/v1/sessions", headers=headers2).json()

        assert len(sessions1) == 1
        assert len(sessions2) == 1
        assert sessions1[0]["name"] == "User1 Session"
        assert sessions2[0]["name"] == "User2 Session"
