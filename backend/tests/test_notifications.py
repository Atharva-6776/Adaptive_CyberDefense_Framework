import pytest
from unittest.mock import patch, MagicMock
from fastapi import status
from datetime import datetime, timezone

from app.models.notification_log import NotificationLog
from app.services.notification_dispatcher import NotificationDispatcher, EmailProvider, SlackProvider
from app.core.config import settings

@pytest.fixture
def mock_providers():
    with patch("app.services.notification_dispatcher.EmailProvider.send") as mock_email, \
         patch("app.services.notification_dispatcher.SlackProvider.send") as mock_slack:
        yield mock_email, mock_slack


def _get_admin_token(client):
    try:
        client.post(
            "/api/v1/auth/register",
            json={"email": "admin2@defense.com", "password": "adminpass", "role": "admin"}
        )
    except:
        pass
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin2@defense.com", "password": "adminpass"}
    )
    return resp.json()["access_token"]


def test_notification_dispatch_success(db_session, mock_providers):
    mock_email, mock_slack = mock_providers
    
    orig_dispatch = settings.ALERT_DISPATCH_ENABLED
    orig_email = settings.ALERT_EMAIL_ENABLED
    orig_slack = settings.ALERT_SLACK_ENABLED
    
    settings.ALERT_DISPATCH_ENABLED = True
    settings.ALERT_EMAIL_ENABLED = True
    settings.ALERT_SLACK_ENABLED = True
    # Make sure we don't have empty host/url that disables providers logic
    orig_host = settings.ALERT_EMAIL_SMTP_HOST
    orig_url = settings.ALERT_SLACK_WEBHOOK_URL
    settings.ALERT_EMAIL_SMTP_HOST = "dummy"
    settings.ALERT_SLACK_WEBHOOK_URL = "http://dummy"
    
    try:
        from app.services.notification_dispatcher import notification_dispatcher
        notification_dispatcher.dispatch(
            db=db_session,
            event_type="test_event",
            subject="Test Subject",
            message="Test Message"
        )
        
        assert mock_email.called
        assert mock_slack.called
        
        # Verify DB logs
        logs = db_session.query(NotificationLog).filter(NotificationLog.event_type == "test_event").all()
        assert len(logs) == 2
        for log in logs:
            assert log.status == "success"
    finally:
        settings.ALERT_DISPATCH_ENABLED = orig_dispatch
        settings.ALERT_EMAIL_ENABLED = orig_email
        settings.ALERT_SLACK_ENABLED = orig_slack
        settings.ALERT_EMAIL_SMTP_HOST = orig_host
        settings.ALERT_SLACK_WEBHOOK_URL = orig_url


def test_notification_dispatch_cooldown(db_session, mock_providers):
    mock_email, mock_slack = mock_providers
    mock_email.reset_mock()
    mock_slack.reset_mock()
    
    orig_dispatch = settings.ALERT_DISPATCH_ENABLED
    orig_email = settings.ALERT_EMAIL_ENABLED
    orig_cooldown = settings.ALERT_COOLDOWN_SECONDS
    orig_host = settings.ALERT_EMAIL_SMTP_HOST
    
    settings.ALERT_DISPATCH_ENABLED = True
    settings.ALERT_EMAIL_ENABLED = True
    settings.ALERT_COOLDOWN_SECONDS = 300
    settings.ALERT_EMAIL_SMTP_HOST = "dummy"
    
    try:
        from app.services.notification_dispatcher import notification_dispatcher
        
        # First dispatch
        notification_dispatcher.dispatch(
            db=db_session,
            event_type="cooldown_event",
            subject="Test 1",
            message="Test Message"
        )
        assert mock_email.called
        
        mock_email.reset_mock()
        
        # Second dispatch (should hit cooldown)
        notification_dispatcher.dispatch(
            db=db_session,
            event_type="cooldown_event",
            subject="Test 2",
            message="Test Message"
        )
        assert not mock_email.called
        
        # Verify cooldown log
        cooldown_logs = db_session.query(NotificationLog).filter(
            NotificationLog.event_type == "cooldown_event",
            NotificationLog.status == "skipped_cooldown"
        ).all()
        assert len(cooldown_logs) == 1
    finally:
        settings.ALERT_DISPATCH_ENABLED = orig_dispatch
        settings.ALERT_EMAIL_ENABLED = orig_email
        settings.ALERT_COOLDOWN_SECONDS = orig_cooldown
        settings.ALERT_EMAIL_SMTP_HOST = orig_host


def test_notification_dispatch_failure(db_session):
    orig_dispatch = settings.ALERT_DISPATCH_ENABLED
    orig_email = settings.ALERT_EMAIL_ENABLED
    orig_host = settings.ALERT_EMAIL_SMTP_HOST
    
    settings.ALERT_DISPATCH_ENABLED = True
    settings.ALERT_EMAIL_ENABLED = True
    settings.ALERT_EMAIL_SMTP_HOST = "dummy"
    
    try:
        with patch("app.services.notification_dispatcher.EmailProvider.send", side_effect=Exception("Network error")):
            from app.services.notification_dispatcher import notification_dispatcher
            notification_dispatcher.dispatch(
                db=db_session,
                event_type="fail_event",
                subject="Test Fail",
                message="Test Message"
            )
            
            logs = db_session.query(NotificationLog).filter(
                NotificationLog.event_type == "fail_event",
                NotificationLog.recipient_channel == "email"
            ).all()
            assert len(logs) == 1
            assert logs[0].status == "failed"
            assert "Network error" in logs[0].failure_reason
    finally:
        settings.ALERT_DISPATCH_ENABLED = orig_dispatch
        settings.ALERT_EMAIL_ENABLED = orig_email
        settings.ALERT_EMAIL_SMTP_HOST = orig_host


def test_get_notification_logs_api(client):
    token = _get_admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/api/v1/notifications/logs", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)


def test_get_notification_config_api(client):
    token = _get_admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/api/v1/notifications/config", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "global_dispatch_enabled" in data
    assert "providers" in data
