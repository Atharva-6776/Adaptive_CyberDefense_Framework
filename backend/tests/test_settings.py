import pytest
from fastapi.testclient import TestClient
from app.services.auth_service import AuthService
from app.schemas.auth import UserRegister


def test_settings_endpoints_admin(client: TestClient, db_session):
    # Register admin user
    user_reg = UserRegister(email="settingsadmin@example.com", password="Password123", role="admin")
    admin = AuthService.register_user(db_session, user_reg)
    admin_tokens = AuthService.create_tokens_for_user(admin)
    admin_headers = {"Authorization": f"Bearer {admin_tokens.access_token}"}

    # 1. GET /api/v1/settings
    res = client.get("/api/v1/settings", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["profile"]["email"] == "settingsadmin@example.com"
    assert data["api"]["apiKey"] == "●●●●●●●●●●●●"  # Secret masked!

    # 2. PUT /api/v1/settings as admin (update security preferences & notifications)
    update_payload = {
        "notifications": {
            "emailAlerts": True,
            "pushAlerts": True,
            "smsAlerts": False,
            "criticalOnly": True,
            "recipientEmail": "admin@example.com"
        },
        "security": {
            "threatDetectionWindowSec": 15,
            "honeypotThreshold": 4,
            "blockDurationSec": 900,
            "autoBlockHighRisk": True,
            "maxFailedLoginAttempts": 5
        },
        "mtd_enabled": True,
        "mtd_rotation_interval_seconds": 90
    }
    res_update = client.put("/api/v1/settings", json=update_payload, headers=admin_headers)
    assert res_update.status_code == 200
    updated_data = res_update.json()
    assert updated_data["notifications"]["pushAlerts"] is True
    assert updated_data["security"]["threatDetectionWindowSec"] == 15
    assert updated_data["mtd"]["rotation_interval_seconds"] == 90


def test_settings_endpoints_rbac_user(client: TestClient, db_session):
    # Register normal user
    user_reg = UserRegister(email="normaluser@example.com", password="Password123", role="user")
    normal_user = AuthService.register_user(db_session, user_reg)
    user_tokens = AuthService.create_tokens_for_user(normal_user)
    user_headers = {"Authorization": f"Bearer {user_tokens.access_token}"}

    # 1. Normal user can GET /api/v1/settings
    res = client.get("/api/v1/settings", headers=user_headers)
    assert res.status_code == 200

    # 2. Normal user CANNOT update sensitive security/mtd settings
    sensitive_payload = {
        "security": {
            "threatDetectionWindowSec": 30,
            "honeypotThreshold": 2,
            "blockDurationSec": 300,
            "autoBlockHighRisk": False,
            "maxFailedLoginAttempts": 3
        }
    }
    res_update = client.put("/api/v1/settings", json=sensitive_payload, headers=user_headers)
    assert res_update.status_code == 403
    assert "Admin access required" in res_update.json()["detail"]
