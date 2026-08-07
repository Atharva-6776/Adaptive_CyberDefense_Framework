import { Link } from "react-router-dom";
import { Camera as CameraIcon, ArrowUpRight, Activity } from "lucide-react";
import type { Camera } from "../../types/dashboard";

interface CameraOverviewProps {
  cameras: Camera[];
}

export default function CameraOverview({ cameras }: CameraOverviewProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <CameraIcon className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Camera Overview</h2>
        </div>
        <Link
          to="/cameras"
          className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
        >
          View all ({cameras.length})
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {cameras.slice(0, 4).map((cam) => (
          <div
            key={cam.id}
            className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 p-3.5 transition hover:border-slate-700"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    cam.status === "online"
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                      : cam.status === "warning"
                      ? "bg-amber-400"
                      : "bg-rose-500"
                  }`}
                />
                <h4 className="text-xs font-bold text-white truncate max-w-[140px]">
                  {cam.name}
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                {cam.location}
              </p>
            </div>

            <div className="text-right text-xs">
              <div className="flex items-center gap-1 text-emerald-400 font-semibold justify-end">
                <Activity className="h-3 w-3" />
                <span>{cam.health}%</span>
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500">
                {cam.fps} FPS • {cam.violations} Violations
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
