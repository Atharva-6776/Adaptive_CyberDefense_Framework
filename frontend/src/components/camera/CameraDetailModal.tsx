import { X, Camera as CameraIcon, RefreshCw } from "lucide-react";
import type { Camera } from "../../types/dashboard";
import { toast } from "sonner";

interface CameraDetailModalProps {
  camera: Camera | null;
  onClose: () => void;
}

export default function CameraDetailModal({ camera, onClose }: CameraDetailModalProps) {
  if (!camera) return null;

  const handleRestartStream = () => {
    toast.info(`Restarting RTSP video feed for ${camera.name}...`);
    setTimeout(() => {
      toast.success(`Stream for ${camera.name} re-established.`);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  camera.status === "online"
                    ? "bg-emerald-500"
                    : camera.status === "warning"
                    ? "bg-amber-400"
                    : "bg-rose-500"
                }`}
              />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                {camera.status} Stream
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-bold text-white">{camera.name}</h2>
            <p className="text-xs text-slate-400">{camera.location}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Big Feed simulation */}
        <div className={`relative flex h-52 w-full items-center justify-center rounded-xl border border-slate-800 bg-gradient-to-br ${camera.previewBg}`}>
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <CameraIcon className="h-12 w-12 text-cyan-400" />
            <p className="font-mono text-xs">SURVEILLANCE FEED ACTIVE</p>
          </div>

          <div className="absolute top-3 left-3 rounded bg-black/70 px-3 py-1 font-mono text-xs text-emerald-400 backdrop-blur-md">
            ● LIVE STREAM
          </div>

          <div className="absolute bottom-3 right-3 rounded bg-black/70 px-3 py-1 font-mono text-xs text-slate-300 backdrop-blur-md">
            {camera.resolution} @ {camera.fps} FPS
          </div>
        </div>

        {/* Telemetry specs grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs">
          <div>
            <span className="text-slate-500 block">IP Address</span>
            <span className="font-mono text-white font-semibold">{camera.ipAddress}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Stream Protocol</span>
            <span className="font-mono text-cyan-400 font-semibold">{camera.streamType}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Health Score</span>
            <span className="font-mono text-emerald-400 font-semibold">{camera.health}%</span>
          </div>
          <div>
            <span className="text-slate-500 block">Violations Logged</span>
            <span className="font-mono text-amber-400 font-semibold">{camera.violations}</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={handleRestartStream}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:border-cyan-500"
          >
            <RefreshCw className="h-4 w-4 text-cyan-400" />
            Restart Stream
          </button>

          <button
            onClick={onClose}
            className="rounded-lg bg-cyan-600 px-5 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
