"""Unit tests for authentication endpoints"""
import pytest


class TestAuthSignup:
    """Tests for user registration"""

    def test_signup_success(self, client):
        """Test successful user registration"""
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "email": "newuser@example.com",
                "username": "newuser",
                "password": "SecurePass123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_signup_without_username(self, client):
        """Test signup without username (should work with null username)"""
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "email": "no_username@example.com",
                "password": "SecurePass123"
            }
        )
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_signup_duplicate_email(self, client):
        """Test that duplicate email returns error"""
        client.post(
            "/api/v1/auth/signup",
            json={"email": "duplicate@example.com", "password": "testpassword"}
        )
        response = client.post(
            "/api/v1/auth/signup",
            json={"email": "duplicate@example.com", "password": "testpassword"}
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Email already registered"

    def test_signup_invalid_email(self, client):
        """Test signup with invalid email format"""
        response = client.post(
            "/api/v1/auth/signup",
            json={"email": "notanemail", "password": "testpassword"}
        )
        assert response.status_code == 422  # Validation error

    def test_signup_missing_password(self, client):
        """Test signup without password"""
        response = client.post(
            "/api/v1/auth/signup",
            json={"email": "test@example.com"}
        )
        assert response.status_code == 422  # Validation error

    def test_signup_missing_email(self, client):
        """Test signup without email"""
        response = client.post(
            "/api/v1/auth/signup",
            json={"password": "testpassword"}
        )
        assert response.status_code == 422  # Validation error


class TestAuthLogin:
    """Tests for user login"""

    def test_login_success(self, client):
        """Test successful login"""
        client.post(
            "/api/v1/auth/signup",
            json={"email": "logintest@example.com", "password": "testpassword123"}
        )
        response = client.post(
            "/api/v1/auth/access",
            json={"email": "logintest@example.com", "password": "testpassword123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        """Test login with wrong password"""
        client.post(
            "/api/v1/auth/signup",
            json={"email": "wrongpass@example.com", "password": "correctpassword"}
        )
        response = client.post(
            "/api/v1/auth/access",
            json={"email": "wrongpass@example.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Incorrect email or password"

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user"""
        response = client.post(
            "/api/v1/auth/access",
            json={"email": "nonexistent@example.com", "password": "anypassword"}
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Incorrect email or password"

    def test_login_invalid_email_format(self, client):
        """Test login with invalid email format"""
        response = client.post(
            "/api/v1/auth/access",
            json={"email": "notanemail", "password": "password"}
        )
        assert response.status_code == 422  # Validation error

    def test_login_missing_credentials(self, client):
        """Test login with missing credentials"""
        response = client.post(
            "/api/v1/auth/access",
            json={}
        )
        assert response.status_code == 422


class TestAuthToken:
    """Tests for token validation"""

    def test_protected_endpoint_without_token(self, client):
        """Test accessing protected endpoint without token"""
        response = client.get("/api/v1/user/me")
        assert response.status_code == 401

    def test_protected_endpoint_with_invalid_token(self, client):
        """Test accessing protected endpoint with invalid token"""
        response = client.get(
            "/api/v1/user/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401

    def test_protected_endpoint_with_valid_token(self, client):
        """Test accessing protected endpoint with valid token"""
        # Register and login
        client.post(
            "/api/v1/auth/signup",
            json={"email": "validtoken@example.com", "password": "testpassword"}
        )
        login_response = client.post(
            "/api/v1/auth/access",
            json={"email": "validtoken@example.com", "password": "testpassword"}
        )
        token = login_response.json()["access_token"]

        # Access protected endpoint
        response = client.get(
            "/api/v1/user/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert "email" in response.json()

    def test_token_contains_user_info(self, client):
        """Test that token contains user information"""
        client.post(
            "/api/v1/auth/signup",
            json={"email": "tokeninfo@example.com", "password": "testpassword"}
        )
        login_response = client.post(
            "/api/v1/auth/access",
            json={"email": "tokeninfo@example.com", "password": "testpassword"}
        )
        token = login_response.json()["access_token"]
        assert len(token) > 0

        # Verify token works
        response = client.get(
            "/api/v1/user/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert response.json()["email"] == "tokeninfo@example.com"
