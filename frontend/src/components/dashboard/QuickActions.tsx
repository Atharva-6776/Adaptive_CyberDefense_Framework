import { RefreshCw, ShieldCheck, Download, Lock, Zap } from "lucide-react";
import { toast } from "sonner";
import type { QuickActionItem } from "../../types/dashboard";

interface QuickActionsProps {
  actions: QuickActionItem[];
}

export default function QuickActions({ actions }: QuickActionsProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "RefreshCw":
        return <RefreshCw className="h-4 w-4 text-cyan-400" />;
      case "ShieldCheck":
        return <ShieldCheck className="h-4 w-4 text-emerald-400" />;
      case "Download":
        return <Download className="h-4 w-4 text-indigo-400" />;
      case "Lock":
        return <Lock className="h-4 w-4 text-rose-400" />;
      default:
        return <Zap className="h-4 w-4 text-cyan-400" />;
    }
  };

  const handleAction = (id: string, label: string) => {
    switch (id) {
      case "qa-1":
        toast.promise(
          new Promise((resolve) => setTimeout(resolve, 1000)),
          {
            loading: "Initiating MTD dynamic IP address rotation...",
            success: "MTD IP rotation complete: 64 target addresses shuffled successfully.",
            error: "Failed to rotate MTD keys",
          }
        );
        break;
      case "qa-2":
        toast.info("System vulnerability scan initiated across 8 surveillance nodes.");
        break;
      case "qa-3":
        toast.success("Incident audit logs compiled and downloaded (incident-log-24h.json).");
        break;
      case "qa-4":
        toast.error("EMERGENCY LOCKDOWN SIGNAL SENT: Perimeter access points isolated.");
        break;
      default:
        toast.info(`Action triggered: ${label}`);
        break;
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        <Zap className="h-5 w-5 text-cyan-400" />
        <h2 className="text-lg font-bold text-white">Quick Tactical Actions</h2>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleAction(action.id, action.label)}
            className={`group flex flex-col justify-between rounded-xl border p-4 text-left transition duration-200 hover:scale-[1.02] active:scale-[0.98] ${
              action.variant === "danger"
                ? "border-rose-900/40 bg-rose-950/20 hover:border-rose-600 hover:bg-rose-950/40"
                : action.variant === "warning"
                ? "border-amber-900/40 bg-amber-950/20 hover:border-amber-600 hover:bg-amber-950/40"
                : "border-slate-800 bg-slate-950/50 hover:border-cyan-500/50 hover:bg-slate-850"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 group-hover:border-cyan-500/30">
                {getIcon(action.iconName)}
              </div>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500 group-hover:text-cyan-400">
                RUN
              </span>
            </div>

            <div className="mt-3">
              <h4 className="text-sm font-bold text-white group-hover:text-cyan-300">
                {action.label}
              </h4>
              <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                {action.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
