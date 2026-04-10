"""Unit tests for user profile endpoints"""
import pytest


class TestUserProfile:
    """Tests for user profile endpoints"""

    def test_get_me(self, client, auth_headers):
        """Test getting current user profile"""
        headers, email = auth_headers
        response = client.get("/api/v1/user/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == email
        assert "id" in data
        assert "username" in data

    def test_get_me_without_auth(self, client):
        """Test getting profile without authentication"""
        response = client.get("/api/v1/user/me")
        assert response.status_code == 401

    def test_get_profile_by_id(self, client, auth_headers):
        """Test getting profile by user ID"""
        headers, _ = auth_headers
        me_response = client.get("/api/v1/user/me", headers=headers)
        user_id = me_response.json()["id"]

        response = client.get(f"/api/v1/user/{user_id}", headers=headers)
        assert response.status_code == 200
        assert response.json()["id"] == user_id

    def test_get_other_user_profile_forbidden(self, client, auth_headers, second_auth_headers):
        """Test that user cannot access another user's profile"""
        headers1, _ = auth_headers
        headers2 = second_auth_headers

        # Get user 2's ID
        user2_response = client.get("/api/v1/user/me", headers=headers2)
        user2_id = user2_response.json()["id"]

        # User 1 tries to access user 2's profile
        response = client.get(f"/api/v1/user/{user2_id}", headers=headers1)
        assert response.status_code == 403

    def test_update_own_email(self, client, auth_headers):
        """Test updating own email"""
        headers, old_email = auth_headers
        me_response = client.get("/api/v1/user/me", headers=headers)
        user_id = me_response.json()["id"]

        new_email = "updated_" + old_email
        response = client.patch(
            f"/api/v1/user/{user_id}",
            json={"email": new_email},
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["email"] == new_email

    def test_update_own_username(self, client, auth_headers):
        """Test updating own username"""
        headers, _ = auth_headers
        me_response = client.get("/api/v1/user/me", headers=headers)
        user_id = me_response.json()["id"]

        response = client.patch(
            f"/api/v1/user/{user_id}",
            json={"username": "NewUsername"},
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["username"] == "NewUsername"

    def test_update_own_password(self, client, auth_headers):
        """Test updating own password"""
        headers, email = auth_headers
        me_response = client.get("/api/v1/user/me", headers=headers)
        user_id = me_response.json()["id"]

        # Update password
        response = client.patch(
            f"/api/v1/user/{user_id}",
            json={"password": "NewPassword123"},
            headers=headers
        )
        assert response.status_code == 200

        # Verify can login with new password
        login_response = client.post(
            "/api/v1/auth/access",
            json={"email": email, "password": "NewPassword123"}
        )
        assert login_response.status_code == 200

    def test_update_multiple_fields(self, client, auth_headers):
        """Test updating multiple profile fields at once"""
        headers, email = auth_headers
        me_response = client.get("/api/v1/user/me", headers=headers)
        user_id = me_response.json()["id"]

        response = client.patch(
            f"/api/v1/user/{user_id}",
            json={
                "email": "multi_" + email,
                "username": "MultiUser"
            },
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "multi_" + email
        assert data["username"] == "MultiUser"

    def test_update_without_changes(self, client, auth_headers):
        """Test update request with no changes"""
        headers, _ = auth_headers
        me_response = client.get("/api/v1/user/me", headers=headers)
        user_id = me_response.json()["id"]

        response = client.patch(
            f"/api/v1/user/{user_id}",
            json={},
            headers=headers
        )
        assert response.status_code == 200

    def test_update_other_user_forbidden(self, client, auth_headers, second_auth_headers):
        """Test that user cannot update another user's profile"""
        headers1, _ = auth_headers
        headers2 = second_auth_headers

        # Get user 2's ID
        user2_response = client.get("/api/v1/user/me", headers=headers2)
        user2_id = user2_response.json()["id"]

        # User 1 tries to update user 2's profile
        response = client.patch(
            f"/api/v1/user/{user2_id}",
            json={"username": "Hacked"},
            headers=headers1
        )
        assert response.status_code == 403

    def test_update_with_invalid_email(self, client, auth_headers):
        """Test update with invalid email format"""
        headers, _ = auth_headers
        me_response = client.get("/api/v1/user/me", headers=headers)
        user_id = me_response.json()["id"]

        response = client.patch(
            f"/api/v1/user/{user_id}",
            json={"email": "notvalid"},
            headers=headers
        )
        assert response.status_code == 422

    def test_update_duplicate_email(self, client, auth_headers, second_auth_headers):
        """Test update with email that belongs to another user"""
        headers1, _ = auth_headers
        headers2 = second_auth_headers

        # Get user 2's email
        user2_response = client.get("/api/v1/user/me", headers=headers2)
        user2_email = user2_response.json()["email"]

        # User 1 tries to update to user 2's email
        user1_response = client.get("/api/v1/user/me", headers=headers1)
        user1_id = user1_response.json()["id"]

        response = client.patch(
            f"/api/v1/user/{user1_id}",
            json={"email": user2_email},
            headers=headers1
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_update_requires_auth(self, client):
        """Test that update requires authentication"""
        response = client.patch(
            "/api/v1/user/1",
            json={"username": "Hacked"}
        )
        assert response.status_code == 401
