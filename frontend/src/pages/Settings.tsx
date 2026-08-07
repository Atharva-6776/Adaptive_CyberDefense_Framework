import { useState } from "react";
import { User, Monitor, Bell, Key, Info, Save, Copy, Check, RefreshCw } from "lucide-react";
import { MOCK_USER_SETTINGS } from "../data/dashboard";
import type { UserSettingsData } from "../types/dashboard";
import { toast } from "sonner";

export default function Settings() {
  const [settings, setSettings] = useState<UserSettingsData>(MOCK_USER_SETTINGS);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile preferences saved successfully.");
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(settings.api.apiKey);
    setCopiedKey(true);
    toast.success("API key copied to clipboard.");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCheckUpdates = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: "Checking for software updates...",
        success: "Framework is up to date (v2.4.0-prod latest release).",
        error: "Update check failed",
      }
    );
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          System Settings & Preferences
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Configure security operator profiles, system appearance, notification alerts & API integration parameters.
        </p>
      </div>

      {/* 1. Profile Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6">
          <User className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Operator Profile</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={settings.profile.name}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, name: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={settings.profile.email}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, email: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Security Role
              </label>
              <input
                type="text"
                disabled
                value={settings.profile.role}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3.5 py-2 text-xs text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Department
              </label>
              <input
                type="text"
                value={settings.profile.department}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, department: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition active:scale-95"
            >
              <Save className="h-4 w-4" />
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* 2. Appearance Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6">
          <Monitor className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Appearance & UI Preferences</h2>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between py-2">
            <div>
              <h4 className="font-semibold text-white">Theme Select</h4>
              <p className="text-slate-400">Choose dashboard color aesthetic</p>
            </div>
            <select
              value={settings.appearance.theme}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  appearance: { ...settings.appearance, theme: e.target.value as any },
                })
              }
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="Dark">Dark Industrial (Default)</option>
              <option value="Cyberpunk">Cyberpunk Neon</option>
              <option value="High Contrast">High Contrast Security</option>
            </select>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
            <div>
              <h4 className="font-semibold text-white">Auto-Refresh Telemetry</h4>
              <p className="text-slate-400">Poll live camera and alert streams every 5 seconds</p>
            </div>
            <input
              type="checkbox"
              checked={settings.appearance.autoRefresh}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  appearance: { ...settings.appearance, autoRefresh: e.target.checked },
                })
              }
              className="h-4 w-4 accent-cyan-500 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. Notification Settings */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6">
          <Bell className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Notification Alert Triggers</h2>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-white">Email Alerts</h4>
              <p className="text-slate-400">Receive immediate notifications for critical breaches</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.emailAlerts}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, emailAlerts: e.target.checked },
                })
              }
              className="h-4 w-4 accent-cyan-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
            <div>
              <h4 className="font-semibold text-white">SMS Security Broadcasts</h4>
              <p className="text-slate-400">Send emergency SMS to on-call security operators</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.smsAlerts}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, smsAlerts: e.target.checked },
                })
              }
              className="h-4 w-4 accent-cyan-500 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4. API Information */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6">
          <Key className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">API Credentials & Endpoints</h2>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-400 mb-1">
              Active API Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={settings.api.apiKey}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 font-mono px-3.5 py-2 text-xs text-cyan-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyApiKey}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:border-cyan-500"
              >
                {copiedKey ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-300" />}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div>
              <span className="text-slate-400 block font-semibold">REST API Endpoint</span>
              <span className="font-mono text-white text-xs">{settings.api.endpoint}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Rate Limit Threshold</span>
              <span className="font-mono text-emerald-400 text-xs">{settings.api.rateLimit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Application Version */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-bold text-white">Application Version</h2>
          </div>
          <span className="font-mono text-xs font-bold text-cyan-400">
            {settings.app.version}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <p className="text-white font-bold">Adaptive CyberDefense Framework Core</p>
            <p className="text-slate-400">Build: {settings.app.build} • Env: {settings.app.environment}</p>
            <p className="text-slate-500 font-mono">Uptime: {settings.app.uptime}</p>
          </div>

          <button
            onClick={handleCheckUpdates}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:border-cyan-500 transition active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
            Check For Updates
          </button>
        </div>
      </div>
    </div>
  );
}