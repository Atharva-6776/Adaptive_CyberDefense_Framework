import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.camera import Camera
from app.models.alert import Alert
from app.models.honeypot import HoneypotLog
from app.services.video_service import video_service
from app.services.alert_service import alert_service


@pytest.fixture
def mock_yolo_model():
    """Mock the YOLO model loading to allow tests to run without best.pt and ultralytics."""
    with patch("app.services.video_service.video_service.get_model") as mock_get_model:
        mock_instance = MagicMock()
        mock_instance.names = {0: "person", 1: "helmet", 2: "vest"}
        mock_get_model.return_value = mock_instance
        yield mock_get_model


@pytest.fixture(autouse=True)
def mock_cv2():
    """Mock cv2.VideoCapture to allow video ingestion tests without real camera."""
    with patch("app.services.video_service.cv2.VideoCapture") as mock_cap:
        mock_cap_instance = MagicMock()
        mock_cap_instance.isOpened.return_value = True
        mock_cap_instance.read.return_value = (True, MagicMock())
        mock_cap.return_value = mock_cap_instance
        yield mock_cap


def test_camera_crud_endpoints(client: TestClient, db_session: Session, mock_yolo_model):
    # 1. Register a user first to authenticate
    register_res = client.post(
        "/api/v1/auth/register",
        json={"email": "operator@safety.com", "password": "SecurePassword123", "role": "admin"}
    )
    assert register_res.status_code == 201
    
    # Login to get JWT
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "operator@safety.com", "password": "SecurePassword123"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Add a new camera
    cam_data = {
        "name": "Test Vault Camera",
        "location": "Vault Section 4",
        "ip_address": "10.0.0.45",
        "stream_url": "0",  # Mock webcam
        "resolution": "1280x720",
        "fps": 15
    }
    add_res = client.post("/api/v1/video/cameras", json=cam_data, headers=headers)
    assert add_res.status_code == 201
    camera_id = add_res.json()["id"]
    assert camera_id is not None
    assert add_res.json()["name"] == "Test Vault Camera"

    # 3. Get all cameras
    list_res = client.get("/api/v1/video/cameras", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 4. Update the camera
    update_res = client.put(
        f"/api/v1/video/cameras/{camera_id}",
        json={"location": "Vault Section 4 Updated"},
        headers=headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["location"] == "Vault Section 4 Updated"


def test_alert_lifecycle_endpoints(client: TestClient, db_session: Session, mock_yolo_model):
    # Register and login
    client.post(
        "/api/v1/auth/register",
        json={"email": "operator2@safety.com", "password": "SecurePassword123", "role": "admin"}
    )
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "operator2@safety.com", "password": "SecurePassword123"}
    )
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    # Add camera
    cam = Camera(name="Alert Cam", location="Gate A", ip_address="192.168.1.1", status="online")
    db_session.add(cam)
    db_session.commit()
    db_session.refresh(cam)

    # 1. Create an alert
    alert_data = {
        "camera_id": cam.id,
        "title": "Missing Helmet Violation",
        "violation_type": "no-helmet",
        "severity": "high",
        "description": "Worker identified without hard hat."
    }
    create_res = client.post("/api/v1/alerts", json=alert_data, headers=headers)
    assert create_res.status_code == 201
    alert_id = create_res.json()["id"]

    # 2. Get list of alerts
    list_res = client.get("/api/v1/alerts", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Resolve the alert
    resolve_res = client.put(
        f"/api/v1/alerts/{alert_id}/resolve",
        json={"status": "resolved"},
        headers=headers
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "resolved"


def test_honeypot_persistence(client: TestClient, db_session: Session):
    # Trigger a honeypot endpoint (e.g. /api/v1/system/env)
    decoy_res = client.get("/api/v1/system/env")
    assert decoy_res.status_code == 404
    
    # Check if a log entry was created in database
    db_log = db_session.query(HoneypotLog).filter(HoneypotLog.decoy_path_triggered == "/api/v1/system/env").first()
    assert db_log is not None
    assert db_log.decoy_path_triggered == "/api/v1/system/env"
    
    # Register and login to view logs
    client.post(
        "/api/v1/auth/register",
        json={"email": "operator3@safety.com", "password": "SecurePassword123", "role": "admin"}
    )
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "operator3@safety.com", "password": "SecurePassword123"}
    )
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}
    
    # Retrieve honeypot logs
    logs_res = client.get("/api/v1/mtd/honeypot/logs", headers=headers)
    assert logs_res.status_code == 200
    assert any(log["decoy_path_triggered"] == "/api/v1/system/env" for log in logs_res.json())


@patch("os.path.exists")
def test_model_loading_error(mock_exists):
    """Test that video_service throws a FileNotFoundError when YOLO model is missing."""
    mock_exists.return_value = False
    with pytest.raises(FileNotFoundError):
        video_service.get_model()
