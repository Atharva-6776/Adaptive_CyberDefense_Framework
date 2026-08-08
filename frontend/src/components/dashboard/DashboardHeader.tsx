import { RefreshCw, ShieldCheck, Radio, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DashboardHeaderProps {
  onRefresh?: () => void;
}

export default function DashboardHeader({ onRefresh }: DashboardHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    toast.info("Refreshing real-time telemetry stream...");
    if (onRefresh) onRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Dashboard telemetry up to date");
    }, 600);
  };

  return (
    <div className="flex min-w-0 flex-col gap-4 border-b border-slate-800/80 pb-6 md:flex-row md:items-start md:justify-between">
      {/* Left: title + subtitle — must be allowed to shrink */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Industrial Defense Command
          </h1>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            <Radio className="h-3 w-3 animate-pulse" />
            LIVE FEED
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Real-time cyber defense telemetry, camera surveillance &amp; MTD dynamic
          threat response.
        </p>
      </div>

      {/* Right: controls — wrap gracefully on narrow screens */}
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300 sm:flex">
          <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-400" />
          <span>
            MTD Defense: <strong className="text-emerald-400">ACTIVE</strong>
          </span>
        </div>

        {/* Search */}
        <div className="relative w-48 sm:w-56">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search assets or alerts..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-500 hover:bg-slate-700 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 text-cyan-400 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>
    </div>
  );
}
