import { Shield, ShieldAlert, Cpu, Lock, RefreshCw, Zap, CheckCircle } from "lucide-react";
import { MOCK_SECURITY_OVERVIEW } from "../data/dashboard";
import { toast } from "sonner";
import { useState } from "react";

export default function Security() {
  const [securityData] = useState(MOCK_SECURITY_OVERVIEW);
  const [isRotating, setIsRotating] = useState(false);

  const handleManualRotation = () => {
    setIsRotating(true);
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          setIsRotating(false);
          resolve(true);
        }, 1200);
      }),
      {
        loading: "Triggering MTD dynamic address space rotation...",
        success: "Dynamic IP mutation completed across 64 edge gateways.",
        error: "Rotation error",
      }
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Adaptive Cyber Security & MTD Command
            </h1>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-400">
              ACTIVE DEFENSE
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Moving Target Defense (MTD) target shuffling, honeypot telemetry & security posture audit.
          </p>
        </div>

        <button
          onClick={handleManualRotation}
          disabled={isRotating}
          className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50 active:scale-95 shadow-lg shadow-cyan-950/40"
        >
          <RefreshCw className={`h-4 w-4 ${isRotating ? "animate-spin" : ""}`} />
          Rotate MTD Address Space
        </button>
      </div>

      {/* 4 Key Security KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Threat Level */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Threat Level
            </span>
            <ShieldAlert className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-emerald-400">
              {securityData.threatLevel}
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
              DEFCON 5
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Normal operational status</p>
        </div>

        {/* Security Score */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Security Score
            </span>
            <Shield className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white">
              {securityData.securityScore}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 100</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400"
              style={{ width: `${securityData.securityScore}%` }}
            />
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              System Health
            </span>
            <Cpu className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white">
              {securityData.systemHealthScore}%
            </span>
            <span className="text-xs font-semibold text-emerald-400">Optimal</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Zero critical core faults</p>
        </div>

        {/* MTD Status */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              MTD Defense Layer
            </span>
            <Zap className="h-5 w-5 text-amber-400" />
          </div>
          <div className="mt-4">
            <span className="text-lg font-bold text-emerald-400 block truncate">
              {securityData.mtdStatus}
            </span>
            <p className="mt-1 text-xs text-slate-400">
              {securityData.mtdRotationsCount} rot/24h • Last: {securityData.lastRotationTime}
            </p>
          </div>
        </div>
      </div>

      {/* Threat Summary Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Active Threat Vector Summary</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">MITRE ATT&CK ALIGNED</span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {securityData.threatSummary.map((threat, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <h4 className="font-bold text-white text-sm">{threat.vector}</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Automated protection layer active
                </p>
              </div>

              <div className="text-right">
                <span className="font-mono text-lg font-bold text-cyan-400 block">
                  {threat.blockedCount.toLocaleString()}
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-500">
                  BLOCKED TARGETS
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Architecture Information */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
        <h3 className="text-base font-bold text-white mb-2">
          Adaptive Moving Target Defense Strategy
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
          The framework continuously mutates surface attack vectors (IP addresses, port mappings, visual streams)
          making recon probes invalid within seconds. Decoy synthetic nodes lure suspicious traffic while real camera endpoints
          remain shielded behind encrypted micro-segmented tunnels.
        </p>
      </div>
    </div>
  );
}