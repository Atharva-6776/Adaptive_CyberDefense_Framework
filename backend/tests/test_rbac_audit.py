import pytest
from fastapi import status
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

def _get_token_for_role(client, role: str):
    email = f"{role}@defense.com"
    try:
        client.post(
            "/api/v1/auth/register",
            json={"email": email, "password": "password123", "role": role}
        )
    except:
        pass
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"}
    )
    return resp.json()["access_token"]


def test_rbac_isolation(client):
    user_token = _get_token_for_role(client, "user")
    analyst_token = _get_token_for_role(client, "analyst")
    admin_token = _get_token_for_role(client, "admin")

    # user trying to block IP -> should 403
    resp = client.post(
        "/api/v1/security/blocks/10.0.0.1/block",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"reason": "test", "duration_minutes": 10}
    )
    assert resp.status_code == status.HTTP_403_FORBIDDEN

    # analyst trying to block IP -> should 403
    resp = client.post(
        "/api/v1/security/blocks/10.0.0.1/block",
        headers={"Authorization": f"Bearer {analyst_token}"},
        json={"reason": "test", "duration_minutes": 10}
    )
    assert resp.status_code == status.HTTP_403_FORBIDDEN

    # admin trying to block IP -> should 200
    resp = client.post(
        "/api/v1/security/blocks/10.0.0.1/block",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"reason": "test", "duration_minutes": 10}
    )
    assert resp.status_code == status.HTTP_200_OK


def test_audit_logging_persistence(client, db_session: Session):
    admin_token = _get_token_for_role(client, "admin")

    # Action 1: Block IP
    client.post(
        "/api/v1/security/blocks/192.168.10.10/block",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"reason": "audit test", "duration_minutes": 5}
    )

    # Action 2: Recalculate
    client.post(
        "/api/v1/security/recalculate",
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    # Verify audit logs were created
    logs = db_session.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
    
    actions = [log.action for log in logs]
    assert "block_ip" in actions
    assert "recalculate_scores" in actions
    
    block_log = next(log for log in logs if log.action == "block_ip" and "192.168.10.10" in log.resource)
    assert block_log.result == "success"
    assert "audit test" in block_log.metadata_json


def test_audit_api_access(client):
    user_token = _get_token_for_role(client, "user")
    admin_token = _get_token_for_role(client, "admin")

    # User trying to get logs
    resp = client.get("/api/v1/audit/logs", headers={"Authorization": f"Bearer {user_token}"})
    assert resp.status_code == status.HTTP_403_FORBIDDEN

    # Admin trying to get logs
    resp = client.get("/api/v1/audit/logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert "items" in data
    assert isinstance(data["items"], list)
    assert "total" in data
