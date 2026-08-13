import { Camera as CameraIcon, Activity, Eye, ShieldAlert } from "lucide-react";
import type { Camera } from "../../types/dashboard";

interface CameraCardProps {
  camera: Camera;
  onOpenDetails: (camera: Camera) => void;
}

export default function CameraCard({ camera, onOpenDetails }: CameraCardProps) {
  const getStatusColor = (status: Camera["status"]) => {
    switch (status) {
      case "online":
        return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]";
      case "warning":
        return "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]";
      case "offline":
      default:
        return "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]";
    }
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl transition-all duration-200 hover:border-cyan-500/50 hover:shadow-cyan-950/20">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${getStatusColor(camera.status)}`} />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              {camera.status}
            </span>
          </div>

          <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">
            {camera.ipAddress}
          </span>
        </div>

        <h3 className="mt-3 text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
          {camera.name}
        </h3>
        <p className="mt-0.5 text-xs text-slate-400">{camera.location}</p>

        {/* Video Preview Placeholder */}
        <div className={`mt-4 relative flex h-36 w-full items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-gradient-to-br ${camera.previewBg}`}>
          {camera.status === "online" ? (
            <img
              src={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/video/live/${camera.id}`}
              alt={camera.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <>
              {/* Grid lines pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:16px_16px]" />

              <div className="z-10 flex flex-col items-center gap-1.5 text-center">
                <CameraIcon className="h-8 w-8 text-slate-600/80 group-hover:text-cyan-400 transition-colors" />
                <span className="font-mono text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  {camera.resolution}
                </span>
              </div>
            </>
          )}

          {/* Stream Overlay info */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded bg-black/60 px-2 py-0.5 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-mono text-[10px] text-slate-300">{camera.fps} FPS</span>
          </div>

          <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-mono text-slate-400 backdrop-blur-md">
            {camera.streamType}
          </div>
        </div>
      </div>

      {/* Stats and Action */}
      <div className="mt-5 space-y-4">
        <div className="grid grid-cols-2 gap-2 border-y border-slate-800/80 py-3 text-xs">
          {/* Health */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-slate-400">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>Camera Health</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full ${
                    camera.health > 80
                      ? "bg-emerald-400"
                      : camera.health > 50
                      ? "bg-amber-400"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${camera.health}%` }}
                />
              </div>
              <span className="font-mono font-bold text-white text-xs">
                {camera.health}%
              </span>
            </div>
          </div>

          {/* Violations */}
          <div className="space-y-1 pl-2 border-l border-slate-800">
            <div className="flex items-center gap-1 text-slate-400">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              <span>Violations</span>
            </div>
            <p className="font-mono font-bold text-white text-sm">
              {camera.violations}{" "}
              <span className="text-[10px] font-normal text-slate-400">
                logged
              </span>
            </p>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={() => onOpenDetails(camera)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-white transition hover:border-cyan-500 hover:bg-cyan-600 hover:shadow-lg active:scale-98"
        >
          <Eye className="h-4 w-4" />
          Open Details
        </button>
      </div>
    </div>
  );
}
