from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class UserProfileSettings(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    created_at: datetime


class NotificationSettings(BaseModel):
    emailAlerts: bool = True
    pushAlerts: bool = False
    smsAlerts: bool = False
    criticalOnly: bool = True
    recipientEmail: Optional[str] = None


class SecurityPreferences(BaseModel):
    threatDetectionWindowSec: int = 10
    honeypotThreshold: int = 3
    blockDurationSec: int = 600
    autoBlockHighRisk: bool = True
    maxFailedLoginAttempts: int = 5


class MTDConfigSettings(BaseModel):
    mtd_enabled: bool = True
    rotation_interval_seconds: int = 60
    decoy_paths_count: int = 5
    seed_configured: bool = True


class ApiConfigSettings(BaseModel):
    apiKey: str = "●●●●●●●●●●●●"  # Secret masked
    endpoint: str = "http://localhost:8000"
    rateLimit: str = "100 req/min"
    corsOrigins: List[str] = ["*"]


class AppearanceSettings(BaseModel):
    theme: str = "Dark"
    compactView: bool = False
    autoRefresh: bool = True
    refreshIntervalSec: int = 5


class AppInfoSettings(BaseModel):
    name: str = "Adaptive Cyber Defense Framework"
    version: str = "1.0.0"
    environment: str = "local"
    uptime: str = "Active"


class SystemSettingsResponse(BaseModel):
    profile: UserProfileSettings
    notifications: NotificationSettings
    security: SecurityPreferences
    mtd: MTDConfigSettings
    api: ApiConfigSettings
    appearance: AppearanceSettings
    app: AppInfoSettings


class SystemSettingsUpdate(BaseModel):
    notifications: Optional[NotificationSettings] = None
    security: Optional[SecurityPreferences] = None
    mtd_enabled: Optional[bool] = None
    mtd_rotation_interval_seconds: Optional[int] = None
    appearance: Optional[AppearanceSettings] = None
