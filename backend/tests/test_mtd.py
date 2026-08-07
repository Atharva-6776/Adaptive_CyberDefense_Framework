import pytest
from fastapi import status
from app.services.mtd_service import mtd_service


def test_mtd_status_requires_auth(client):
    response = client.get("/api/v1/mtd/status")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_mtd_status_response_fields(client):
    # Register and login
    client.post(
        "/api/v1/auth/register",
        json={"email": "analyst@defense.com", "password": "securepassword123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "analyst@defense.com", "password": "securepassword123"}
    )
    access_token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    response = client.get("/api/v1/mtd/status", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "mtd_enabled" in data
    assert data["mtd_enabled"] is True
    assert "active_routes" in data
    assert len(data["active_routes"]) > 0
    assert "decoy_paths" in data
    assert len(data["decoy_paths"]) > 0


def test_honeypot_interception_decoy_paths(client):
    # 1. Trigger decoy endpoint directly without credentials
    # Decoy: /api/v1/admin/debug
    response = client.get("/api/v1/admin/debug")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    
    # 2. Register, login, and verify that the trigger was logged in honeypot logs
    client.post(
        "/api/v1/auth/register",
        json={"email": "analyst@defense.com", "password": "securepassword123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "analyst@defense.com", "password": "securepassword123"}
    )
    access_token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    logs_resp = client.get("/api/v1/mtd/honeypot/logs", headers=headers)
    assert logs_resp.status_code == status.HTTP_200_OK
    logs = logs_resp.json()
    assert len(logs) > 0
    assert any(log["decoy_path_triggered"] == "/api/v1/admin/debug" for log in logs)


def test_manual_rotation(client):
    # Register and login
    client.post(
        "/api/v1/auth/register",
        json={"email": "analyst@defense.com", "password": "securepassword123"}
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "analyst@defense.com", "password": "securepassword123"}
    )
    access_token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # Fetch initial status
    initial_resp = client.get("/api/v1/mtd/status", headers=headers)
    initial_routes = initial_resp.json()["active_routes"]

    # Trigger manual rotation
    rotate_resp = client.post("/api/v1/mtd/rotate", headers=headers)
    assert rotate_resp.status_code == status.HTTP_200_OK
    new_routes = rotate_resp.json()["status"]["active_routes"]

    # Ensure dynamic paths have changed
    assert initial_routes != new_routes
    assert len(initial_routes) == len(new_routes)
