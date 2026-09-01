import { useEffect, useState } from "react";
import {
  User,
  Bell,
  Shield,
  Shuffle,
  Key,
  Save,
  RefreshCw,
  Loader2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../store/authStore";
import {
  getSettings,
  updateSettings,
  type SystemSettingsResponse,
} from "../api/settings";

export default function Settings() {
  const user = useAuthStore((state) => state.user);

  const [settingsData, setSettingsData] = useState<SystemSettingsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Form states
  const [emailAlerts, setEmailAlerts] = useState<boolean>(true);
  const [pushAlerts, setPushAlerts] = useState<boolean>(false);
  const [smsAlerts, setSmsAlerts] = useState<boolean>(false);
  const [criticalOnly, setCriticalOnly] = useState<boolean>(true);
  const [recipientEmail, setRecipientEmail] = useState<string>("");

  const [threatDetectionWindowSec, setThreatDetectionWindowSec] = useState<number>(10);
  const [honeypotThreshold, setHoneypotThreshold] = useState<number>(3);
  const [blockDurationSec, setBlockDurationSec] = useState<number>(600);
  const [autoBlockHighRisk, setAutoBlockHighRisk] = useState<boolean>(true);

  const [mtdEnabled, setMtdEnabled] = useState<boolean>(true);
  const [rotationIntervalSec, setRotationIntervalSec] = useState<number>(60);

  const [theme, setTheme] = useState<string>("Dark");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const fetchSystemSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettingsData(data);

      // Populate form controls
      setEmailAlerts(data.notifications.emailAlerts);
      setPushAlerts(data.notifications.pushAlerts);
      setSmsAlerts(data.notifications.smsAlerts);
      setCriticalOnly(data.notifications.criticalOnly);
      setRecipientEmail(data.notifications.recipientEmail || data.profile.email);

      setThreatDetectionWindowSec(data.security.threatDetectionWindowSec);
      setHoneypotThreshold(data.security.honeypotThreshold);
      setBlockDurationSec(data.security.blockDurationSec);
      setAutoBlockHighRisk(data.security.autoBlockHighRisk);

      setMtdEnabled(data.mtd.mtd_enabled);
      setRotationIntervalSec(data.mtd.rotation_interval_seconds);

      setTheme(data.appearance.theme);
      setAutoRefresh(data.appearance.autoRefresh);
    } catch (err: any) {
      console.error("Settings fetch error:", err);
      toast.error("Failed to load system settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: any = {
        notifications: {
          emailAlerts,
          pushAlerts,
          smsAlerts,
          criticalOnly,
          recipientEmail,
        },
        appearance: {
          theme,
          compactView: false,
          autoRefresh,
          refreshIntervalSec: 5,
        },
      };

      // Only add security/mtd if admin
      if (user?.role === "admin") {
        payload.security = {
          threatDetectionWindowSec,
          honeypotThreshold,
          blockDurationSec,
          autoBlockHighRisk,
          maxFailedLoginAttempts: 5,
        };
        payload.mtd_enabled = mtdEnabled;
        payload.mtd_rotation_interval_seconds = rotationIntervalSec;
      }

      const updated = await updateSettings(payload);
      setSettingsData(updated);
      toast.success("System settings updated & saved successfully.");
    } catch (err: any) {
      console.error("Save settings error:", err);
      const msg = err.response?.data?.detail || "Failed to save settings.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl text-white min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              System Settings & Preferences
            </h1>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Settings Engine Active
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Configure threat detection windows, notification channels, MTD rotation intervals, and API settings.
          </p>
        </div>

        <button
          onClick={fetchSystemSettings}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>Reload Config</span>
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* Section 1: Authenticated User Information */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <User className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Authenticated Account Profile</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Email Address
              </label>
              <div className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white font-mono">
                {user?.email || "Unknown user"}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Assigned Role
              </label>
              <div className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-cyan-400 font-mono font-bold uppercase">
                {user?.role || "NO ROLE"}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Account Status
              </label>
              <div className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-emerald-400 font-mono font-bold">
                {user?.is_active ? "Active" : "Inactive"}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Account ID
              </label>
              <div className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-400 font-mono">
                {user?.id != null ? `#${user.id}` : "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Notification Channels */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <Bell className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Alert Notification Preferences</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 text-xs">
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <span className="font-semibold text-white">Email Security Alerts</span>
                  <p className="text-slate-400 text-[11px]">Send incident digests to configured email</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushAlerts}
                  onChange={(e) => setPushAlerts(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <span className="font-semibold text-white">Browser Push Notifications</span>
                  <p className="text-slate-400 text-[11px]">Real-time desktop popup notifications</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={criticalOnly}
                  onChange={(e) => setCriticalOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <span className="font-semibold text-white">Critical Severity Only</span>
                  <p className="text-slate-400 text-[11px]">Filter out low/medium warning alerts</p>
                </div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="block font-semibold text-slate-400">
                Recipient Notification Email
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Security Thresholds & Risk Engine (Admin Only) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-400" />
              <h2 className="text-lg font-bold text-white">Threat Mitigation & Risk Engine</h2>
            </div>
            {user?.role !== "admin" && (
              <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                <Lock className="h-3.5 w-3.5" /> Admin Access Required
              </span>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Detection Window (Seconds)
              </label>
              <input
                type="number"
                disabled={user?.role !== "admin"}
                value={threatDetectionWindowSec}
                onChange={(e) => setThreatDetectionWindowSec(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white font-mono focus:border-cyan-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Honeypot Trigger Threshold (Hits)
              </label>
              <input
                type="number"
                disabled={user?.role !== "admin"}
                value={honeypotThreshold}
                onChange={(e) => setHoneypotThreshold(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white font-mono focus:border-cyan-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Auto IP Block Duration (Seconds)
              </label>
              <input
                type="number"
                disabled={user?.role !== "admin"}
                value={blockDurationSec}
                onChange={(e) => setBlockDurationSec(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white font-mono focus:border-cyan-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={user?.role !== "admin"}
                  checked={autoBlockHighRisk}
                  onChange={(e) => setAutoBlockHighRisk(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
                />
                <div>
                  <span className="font-semibold text-white">Auto-Blacklist High Risk IPs</span>
                  <p className="text-slate-400 text-[11px]">Enforce dynamic 403 blocks automatically</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: MTD Configurations (Admin Only) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Shuffle className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Moving Target Defense (MTD)</h2>
            </div>
            {user?.role !== "admin" && (
              <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                <Lock className="h-3.5 w-3.5" /> Admin Access Required
              </span>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 text-xs">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                disabled={user?.role !== "admin"}
                checked={mtdEnabled}
                onChange={(e) => setMtdEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
              />
              <div>
                <span className="font-semibold text-white">Enable MTD Dynamic Route Shuffling</span>
                <p className="text-slate-400 text-[11px]">Automatically rotate active protected API paths</p>
              </div>
            </label>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Rotation Interval (Seconds)
              </label>
              <input
                type="number"
                disabled={user?.role !== "admin"}
                value={rotationIntervalSec}
                onChange={(e) => setRotationIntervalSec(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white font-mono focus:border-cyan-500 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Section 5: API & Secrets Management */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <Key className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">API Key & Secrets Management</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                API Secret Key
              </label>
              <div className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-500 font-mono flex items-center justify-between">
                <span>{settingsData?.api.apiKey || "●●●●●●●●●●●●"}</span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase">Protected</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Secrets are masked and protected by security policy.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Core API Endpoint URL
              </label>
              <div className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white font-mono">
                {settingsData?.api.endpoint || "http://localhost:8000"}
              </div>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-cyan-500 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save System Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}