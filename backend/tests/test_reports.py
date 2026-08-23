import pytest
from fastapi.testclient import TestClient
from app.services.auth_service import AuthService
from app.schemas.auth import UserRegister


def test_reports_endpoints(client: TestClient, db_session):
    # Register and login admin user
    user_reg = UserRegister(email="reportadmin@example.com", password="Password123", role="admin")
    user = AuthService.register_user(db_session, user_reg)
    tokens = AuthService.create_tokens_for_user(user)
    headers = {"Authorization": f"Bearer {tokens.access_token}"}

    # 1. Test GET /api/v1/reports
    res = client.get("/api/v1/reports", headers=headers)
    assert res.status_code == 200
    reports = res.json()
    assert isinstance(reports, list)
    assert len(reports) >= 4

    # 2. Test GET /api/v1/reports/summary
    res_summary = client.get("/api/v1/reports/summary", headers=headers)
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert "total_events" in summary
    assert "honeypot_hits_24h" in summary

    # 3. Test POST /api/v1/reports/generate
    gen_payload = {"report_type": "security_audit", "format": "JSON"}
    res_gen = client.post("/api/v1/reports/generate", json=gen_payload, headers=headers)
    assert res_gen.status_code == 200
    report_data = res_gen.json()
    assert report_data["id"] == "security_audit"
    assert "summary" in report_data

    # 4. Test GET /api/v1/reports/export/security_audit
    res_export = client.get("/api/v1/reports/export/security_audit?format=CSV", headers=headers)
    assert res_export.status_code == 200
    assert "Category,Key,Value" in res_export.text

    # 5. Test GET /api/v1/reports/audit-logs
    res_audit = client.get("/api/v1/reports/audit-logs", headers=headers)
    assert res_audit.status_code == 200
    logs = res_audit.json()
    assert len(logs) >= 2  # REPORT_GENERATED and REPORT_EXPORTED
