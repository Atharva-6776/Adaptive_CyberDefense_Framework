import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.alert import Alert
from app.models.camera import Camera
from app.schemas.alerts import AlertCreate

logger = logging.getLogger("alerts")


class AlertService:
    def __init__(self):
        # In-memory cooldown storage to prevent duplicate alert spam
        # Key: (camera_id, violation_type) -> value: last_triggered_timestamp
        self.cooldowns: Dict[Tuple[int, str], datetime] = {}
        self.cooldown_interval = timedelta(seconds=15)  # 15 seconds cooldown

    def is_in_cooldown(self, camera_id: int, violation_type: str) -> bool:
        now = datetime.now(timezone.utc)
        key = (camera_id, violation_type)
        if key in self.cooldowns:
            last_triggered = self.cooldowns[key]
            if now - last_triggered < self.cooldown_interval:
                return True
        return False

    def update_cooldown(self, camera_id: int, violation_type: str) -> None:
        self.cooldowns[(camera_id, violation_type)] = datetime.now(timezone.utc)

    def create_alert(self, db: Session, alert_data: AlertCreate) -> Alert:
        # Check cooldown
        if self.is_in_cooldown(alert_data.camera_id, alert_data.violation_type):
            logger.info(
                f"Alert for Camera {alert_data.camera_id} and Violation {alert_data.violation_type} is in cooldown. Skipped."
            )
            # Find and return the most recent alert of this type instead
            last_alert = (
                db.query(Alert)
                .filter(
                    Alert.camera_id == alert_data.camera_id,
                    Alert.violation_type == alert_data.violation_type,
                )
                .order_by(Alert.id.desc())
                .first()
            )
            # Wait, if last_alert doesn't exist, we bypass cooldown
            if last_alert:
                return last_alert

        # Create alert in database
        db_alert = Alert(
            camera_id=alert_data.camera_id,
            title=alert_data.title,
            violation_type=alert_data.violation_type,
            timestamp=datetime.now(timezone.utc),
            severity=alert_data.severity,
            status=alert_data.status,
            description=alert_data.description,
            evidence_path=alert_data.evidence_path,
        )
        db.add(db_alert)

        # Update violations counter on the camera
        camera = db.query(Camera).filter(Camera.id == alert_data.camera_id).first()
        if camera:
            camera.violations += 1
            camera.status = "warning"
            camera.last_active = datetime.now(timezone.utc)
            db.add(camera)

        db.commit()
        db.refresh(db_alert)

        # Register trigger in cooldowns
        self.update_cooldown(alert_data.camera_id, alert_data.violation_type)
        logger.warning(
            f"SAFETY ALERT REGISTERED: Camera {alert_data.camera_id} ({camera.name if camera else 'Unknown'}), Violation: {alert_data.violation_type}"
        )

        if alert_data.severity.lower() == "critical":
            try:
                from app.services.notification_dispatcher import notification_dispatcher
                notification_dispatcher.dispatch(
                    db=db,
                    event_type="safety_yolo_critical",
                    subject=f"CRITICAL Safety Alert: {alert_data.title}",
                    message=f"Camera ID: {alert_data.camera_id}\nViolation: {alert_data.violation_type}\nDescription: {alert_data.description}",
                    reference_id=str(db_alert.id)
                )
            except Exception as e:
                logger.error(f"[AlertService] Failed to dispatch critical alert: {e}")

        return db_alert

    def get_alerts(self, db: Session, skip: int = 0, limit: int = 100) -> List[Alert]:
        return db.query(Alert).order_by(Alert.timestamp.desc()).offset(skip).limit(limit).all()

    def get_alert_by_id(self, db: Session, alert_id: int) -> Optional[Alert]:
        return db.query(Alert).filter(Alert.id == alert_id).first()

    def update_alert_status(self, db: Session, alert_id: int, status: str) -> Optional[Alert]:
        db_alert = self.get_alert_by_id(db, alert_id)
        if not db_alert:
            return None
        db_alert.status = status
        db.add(db_alert)
        db.commit()
        db.refresh(db_alert)
        return db_alert


alert_service = AlertService()
