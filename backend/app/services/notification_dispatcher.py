import smtplib
import json
import logging
from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from email.mime.text import MIMEText

import requests
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.notification_log import NotificationLog

logger = logging.getLogger("notification_dispatcher")

class NotificationProvider(ABC):
    @property
    @abstractmethod
    def channel_name(self) -> str:
        pass

    @abstractmethod
    def is_enabled(self) -> bool:
        pass

    @abstractmethod
    def send(self, subject: str, message: str) -> None:
        pass


class EmailProvider(NotificationProvider):
    @property
    def channel_name(self) -> str:
        return "email"

    def is_enabled(self) -> bool:
        return settings.ALERT_EMAIL_ENABLED

    def send(self, subject: str, message: str) -> None:
        if not self.is_enabled():
            return
            
        msg = MIMEText(message)
        msg['Subject'] = subject
        msg['From'] = settings.ALERT_EMAIL_FROM
        msg['To'] = settings.ALERT_EMAIL_TO

        # We will attempt to connect using the configured SMTP host
        with smtplib.SMTP(settings.ALERT_EMAIL_SMTP_HOST, settings.ALERT_EMAIL_SMTP_PORT) as server:
            if settings.ALERT_EMAIL_SMTP_USER and settings.ALERT_EMAIL_SMTP_PASSWORD:
                server.starttls()
                server.login(settings.ALERT_EMAIL_SMTP_USER, settings.ALERT_EMAIL_SMTP_PASSWORD)
            server.send_message(msg)


class SlackProvider(NotificationProvider):
    @property
    def channel_name(self) -> str:
        return "slack"

    def is_enabled(self) -> bool:
        return settings.ALERT_SLACK_ENABLED and bool(settings.ALERT_SLACK_WEBHOOK_URL)

    def send(self, subject: str, message: str) -> None:
        if not self.is_enabled():
            return
            
        payload = {
            "text": f"*{subject}*\n{message}"
        }
        response = requests.post(
            settings.ALERT_SLACK_WEBHOOK_URL, 
            json=payload,
            timeout=10
        )
        response.raise_for_status()


class NotificationDispatcher:
    def __init__(self):
        self.providers: List[NotificationProvider] = [EmailProvider(), SlackProvider()]

    def is_in_cooldown(self, db: Session, event_type: str) -> bool:
        threshold_time = datetime.now(timezone.utc) - timedelta(seconds=settings.ALERT_COOLDOWN_SECONDS)
        
        recent_log = db.query(NotificationLog).filter(
            NotificationLog.event_type == event_type,
            NotificationLog.status == "success",
            NotificationLog.timestamp >= threshold_time
        ).first()
        
        return recent_log is not None

    def dispatch(self, db: Session, event_type: str, subject: str, message: str, reference_id: Optional[str] = None) -> None:
        if not settings.ALERT_DISPATCH_ENABLED:
            logger.info(f"Alert dispatch is disabled globally. Skipping {event_type}.")
            return

        if self.is_in_cooldown(db, event_type):
            logger.info(f"Alert {event_type} is in cooldown. Skipped dispatch.")
            cooldown_log = NotificationLog(
                event_type=event_type,
                recipient_channel="all",
                status="skipped_cooldown",
                timestamp=datetime.now(timezone.utc),
                reference_id=reference_id
            )
            db.add(cooldown_log)
            db.commit()
            return

        dispatched_any = False

        for provider in self.providers:
            if not provider.is_enabled():
                continue
            
            dispatched_any = True
            log_entry = NotificationLog(
                event_type=event_type,
                recipient_channel=provider.channel_name,
                reference_id=reference_id,
                timestamp=datetime.now(timezone.utc)
            )
            
            try:
                provider.send(subject, message)
                log_entry.status = "success"
                logger.info(f"Successfully dispatched alert {event_type} via {provider.channel_name}")
            except Exception as e:
                log_entry.status = "failed"
                log_entry.failure_reason = str(e)
                logger.error(f"Failed to dispatch alert {event_type} via {provider.channel_name}: {e}")
                
            db.add(log_entry)
            
        if dispatched_any:
            db.commit()


notification_dispatcher = NotificationDispatcher()
