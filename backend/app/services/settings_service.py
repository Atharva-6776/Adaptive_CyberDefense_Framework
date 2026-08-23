import json
import logging
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session

from app.core.config import settings as global_settings
from app.models.system_setting import SystemSetting
from app.models.user import User
from app.schemas.settings import (
    SystemSettingsResponse,
    UserProfileSettings,
    NotificationSettings,
    SecurityPreferences,
    MTDConfigSettings,
    ApiConfigSettings,
    AppearanceSettings,
    AppInfoSettings,
    SystemSettingsUpdate,
)
from app.services.mtd_service import mtd_service
from app.services.report_service import report_service

logger = logging.getLogger("settings")


class SettingsService:
    def _get_setting_value(self, db: Session, category: str, key: str, default_val: Any) -> Any:
        """Retrieves setting value from DB if available, falling back to default."""
        record = db.query(SystemSetting).filter(
            SystemSetting.category == category,
            SystemSetting.key == key
        ).first()
        if record:
            try:
                return json.loads(record.value)
            except Exception:
                return record.value
        return default_val

    def _set_setting_value(self, db: Session, category: str, key: str, value: Any, user_email: str) -> None:
        """Persists setting value into DB."""
        record = db.query(SystemSetting).filter(
            SystemSetting.category == category,
            SystemSetting.key == key
        ).first()
        val_str = json.dumps(value) if not isinstance(value, str) else value
        if record:
            record.value = val_str
            record.updated_by = user_email
        else:
            record = SystemSetting(
                category=category,
                key=key,
                value=val_str,
                updated_by=user_email,
            )
            db.add(record)
        db.commit()

    def get_system_settings(self, db: Session, user: User) -> SystemSettingsResponse:
        """Collects full system configuration with masked secrets."""
        # 1. User Profile
        profile = UserProfileSettings(
            id=user.id,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
        )

        # 2. Notifications
        notifications = NotificationSettings(
            emailAlerts=self._get_setting_value(db, "notifications", "emailAlerts", True),
            pushAlerts=self._get_setting_value(db, "notifications", "pushAlerts", False),
            smsAlerts=self._get_setting_value(db, "notifications", "smsAlerts", False),
            criticalOnly=self._get_setting_value(db, "notifications", "criticalOnly", True),
            recipientEmail=self._get_setting_value(db, "notifications", "recipientEmail", user.email),
        )

        # 3. Security Preferences
        security = SecurityPreferences(
            threatDetectionWindowSec=self._get_setting_value(
                db, "security", "threatDetectionWindowSec", global_settings.THREAT_DETECTION_WINDOW_SECONDS
            ),
            honeypotThreshold=self._get_setting_value(
                db, "security", "honeypotThreshold", global_settings.THREAT_HONEYPOT_THRESHOLD
            ),
            blockDurationSec=self._get_setting_value(
                db, "security", "blockDurationSec", global_settings.THREAT_BLOCK_DURATION_SECONDS
            ),
            autoBlockHighRisk=self._get_setting_value(db, "security", "autoBlockHighRisk", True),
            maxFailedLoginAttempts=self._get_setting_value(db, "security", "maxFailedLoginAttempts", 5),
        )

        # 4. MTD Config
        mtd = MTDConfigSettings(
            mtd_enabled=mtd_service.enabled,
            rotation_interval_seconds=mtd_service.rotation_interval,
            decoy_paths_count=len(mtd_service.decoy_paths),
            seed_configured=bool(mtd_service.seed),
        )

        # 5. API Config (Masked secrets)
        api = ApiConfigSettings(
            apiKey="●●●●●●●●●●●●",  # NEVER return real API keys or JWT secrets!
            endpoint="http://localhost:8000",
            rateLimit=self._get_setting_value(db, "api", "rateLimit", "100 req/min"),
            corsOrigins=global_settings.BACKEND_CORS_ORIGINS,
        )

        # 6. Appearance
        appearance = AppearanceSettings(
            theme=self._get_setting_value(db, "appearance", "theme", "Dark"),
            compactView=self._get_setting_value(db, "appearance", "compactView", False),
            autoRefresh=self._get_setting_value(db, "appearance", "autoRefresh", True),
            refreshIntervalSec=self._get_setting_value(db, "appearance", "refreshIntervalSec", 5),
        )

        # 7. App Info
        app_info = AppInfoSettings(
            name=global_settings.PROJECT_NAME,
            version="1.0.0",
            environment="local",
            uptime="Active",
        )

        return SystemSettingsResponse(
            profile=profile,
            notifications=notifications,
            security=security,
            mtd=mtd,
            api=api,
            appearance=appearance,
            app=app_info,
        )

    def update_system_settings(
        self,
        db: Session,
        user: User,
        update: SystemSettingsUpdate,
        ip_address: Optional[str] = None,
    ) -> SystemSettingsResponse:
        """Updates system configuration and audits sensitive changes."""
        changes: Dict[str, Any] = {}

        # 1. Update Notifications
        if update.notifications is not None:
            n_dict = update.notifications.model_dump()
            for k, v in n_dict.items():
                self._set_setting_value(db, "notifications", k, v, user.email)
            changes["notifications"] = n_dict

        # 2. Update Security Preferences
        if update.security is not None:
            s_dict = update.security.model_dump()
            for k, v in s_dict.items():
                self._set_setting_value(db, "security", k, v, user.email)
                # Update global settings in memory if applicable
                if k == "threatDetectionWindowSec":
                    global_settings.THREAT_DETECTION_WINDOW_SECONDS = int(v)
                elif k == "honeypotThreshold":
                    global_settings.THREAT_HONEYPOT_THRESHOLD = int(v)
                elif k == "blockDurationSec":
                    global_settings.THREAT_BLOCK_DURATION_SECONDS = int(v)
            changes["security"] = s_dict

        # 3. Update MTD Settings
        if update.mtd_enabled is not None:
            global_settings.MTD_ENABLED = update.mtd_enabled
            mtd_service.enabled = update.mtd_enabled
            self._set_setting_value(db, "mtd", "mtd_enabled", update.mtd_enabled, user.email)
            changes["mtd_enabled"] = update.mtd_enabled

        if update.mtd_rotation_interval_seconds is not None:
            val = int(update.mtd_rotation_interval_seconds)
            global_settings.MTD_ROTATION_INTERVAL_SECONDS = val
            mtd_service.rotation_interval = val
            self._set_setting_value(db, "mtd", "rotation_interval_seconds", val, user.email)
            changes["mtd_rotation_interval_seconds"] = val

        # 4. Update Appearance
        if update.appearance is not None:
            app_dict = update.appearance.model_dump()
            for k, v in app_dict.items():
                self._set_setting_value(db, "appearance", k, v, user.email)
            changes["appearance"] = app_dict

        # Create audit log entry for settings modification
        report_service.create_audit_log(
            db=db,
            user=user,
            action="SETTINGS_UPDATED",
            resource="settings",
            details=f"Updated settings parameters: {json.dumps(changes)}",
            ip_address=ip_address,
        )

        logger.info(f"System settings updated by user {user.email} from IP {ip_address}")
        return self.get_system_settings(db, user)


settings_service = SettingsService()
