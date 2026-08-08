import { useAuthStore } from "../store/authStore";
import { User, AlertCircle } from "lucide-react";

export default function Settings() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-8 max-w-5xl text-white">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          System Settings & Preferences
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Authenticated user account parameters and system settings.
        </p>
      </div>

      {/* Authenticated User Information */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm space-y-6">
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

      {/* Backend Integration Pending Banner */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/90 p-12 text-center shadow-xl space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-amber-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Backend integration pending</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Extended system preferences, notification channels, and API key management endpoints (`/api/v1/settings`) are not implemented on the server yet.
          </p>
        </div>
      </div>
    </div>
  );
}