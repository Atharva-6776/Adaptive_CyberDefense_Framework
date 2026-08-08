import { ShieldAlert, AlertCircle } from "lucide-react";

export default function Alerts() {
  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Security Incident & Alerts Log
            </h1>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-xs font-semibold text-amber-400">
              Not connected
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time cyber defense intrusion triggers, visual anomaly logs & incident mitigation.
          </p>
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
            The security alert logging and incident telemetry backend endpoints (`/api/v1/alerts`) are not implemented on the server yet.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-mono text-slate-400">
          <ShieldAlert className="h-4 w-4 text-slate-500" />
          <span>Status: Alert Engine Disconnected</span>
        </div>
      </div>
    </div>
  );
}