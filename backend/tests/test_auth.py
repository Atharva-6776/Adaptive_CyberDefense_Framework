import pytest
from fastapi import status
from app.services.mtd_service import mtd_service


def test_register_user_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@defense.com", "password": "securepassword123", "role": "analyst"}
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "test@defense.com"
    assert data["role"] == "analyst"
    assert "id" in data


def test_register_user_duplicate(client):
    # First registration
    client.post(
        "/api/v1/auth/register",
        json={"email": "test@defense.com", "password": "securepassword123"}
    )
    # Second registration
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@defense.com", "password": "anotherpassword"}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "Email already registered"


def test_login_success(client):
    # Register
    client.post(
        "/api/v1/auth/register",
        json={"email": "test@defense.com", "password": "securepassword123"}
    )
    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@defense.com", "password": "securepassword123"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@defense.com", "password": "wrongpassword"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_profile_mtd_interception_and_success(client):
    # Register and Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "test@defense.com", "password": "securepassword123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "test@defense.com", "password": "securepassword123"}
    )
    tokens = login_resp.json()
    access_token = tokens["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # 1. Direct access to `/api/v1/auth/me` should be blocked/404 under MTD
    direct_resp = client.get("/api/v1/auth/me", headers=headers)
    assert direct_resp.status_code == status.HTTP_404_NOT_FOUND

    # 2. Query MTD status to discover active dynamic path (we can query MTD status route)
    status_resp = client.get("/api/v1/mtd/status", headers=headers)
    assert status_resp.status_code == status.HTTP_200_OK
    mtd_data = status_resp.json()
    
    # Locate dynamic route for `/api/v1/auth/me`
    active_routes = mtd_data["active_routes"]
    dynamic_me_path = next(k for k, v in active_routes.items() if v == "/api/v1/auth/me")
    
    # 3. Requesting dynamic path should successfully serve the profile
    dyn_resp = client.get(dynamic_me_path, headers=headers)
    assert dyn_resp.status_code == status.HTTP_200_OK
    assert dyn_resp.json()["email"] == "test@defense.com"


def test_refresh_token_success(client):
    # Register and Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "test@defense.com", "password": "securepassword123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "test@defense.com", "password": "securepassword123"}
    )
    tokens = login_resp.json()
    refresh_token = tokens["refresh_token"]

    # Refresh
    refresh_resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert refresh_resp.status_code == status.HTTP_200_OK
    new_tokens = refresh_resp.json()
    assert "access_token" in new_tokens
    assert new_tokens["refresh_token"] == refresh_token


def test_logout_and_blacklist(client):
    # Register and Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "test@defense.com", "password": "securepassword123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "test@defense.com", "password": "securepassword123"}
    )
    tokens = login_resp.json()
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    # Discover dynamic logout path
    headers = {"Authorization": f"Bearer {access_token}"}
    status_resp = client.get("/api/v1/mtd/status", headers=headers)
    active_routes = status_resp.json()["active_routes"]
    dynamic_logout_path = next(k for k, v in active_routes.items() if v == "/api/v1/auth/logout")

    # Logout
    logout_resp = client.post(
        dynamic_logout_path,
        json={"refresh_token": refresh_token},
        headers=headers
    )
    assert logout_resp.status_code == status.HTTP_200_OK

    # Try profile using same access token (should fail because blacklisted)
    dynamic_me_path = next(k for k, v in active_routes.items() if v == "/api/v1/auth/me")
    me_resp = client.get(dynamic_me_path, headers=headers)
    assert me_resp.status_code == status.HTTP_401_UNAUTHORIZED

    # Try refreshing token using blacklisted refresh token (should fail)
    refresh_resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert refresh_resp.status_code == status.HTTP_401_UNAUTHORIZED
