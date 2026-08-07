import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera as CameraIcon, RefreshCw } from "lucide-react";
import { MOCK_CAMERAS } from "../data/dashboard";
import { toast } from "sonner";

export default function CameraDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const camera = MOCK_CAMERAS.find((c) => c.id === id) || MOCK_CAMERAS[0];

  const handleRestart = () => {
    toast.info(`Restarting feed for ${camera.name}...`);
    setTimeout(() => toast.success("Stream re-established."), 800);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/cameras")}
        className="flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cameras Grid
      </button>

      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{camera.name}</h1>
          <p className="text-xs text-slate-400">{camera.location} • {camera.ipAddress}</p>
        </div>

        <button
          onClick={handleRestart}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white hover:border-cyan-500"
        >
          <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
          Restart Feed
        </button>
      </div>

      <div className={`relative flex h-80 w-full items-center justify-center rounded-2xl border border-slate-800 bg-gradient-to-br ${camera.previewBg}`}>
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <CameraIcon className="h-16 w-16 text-cyan-400" />
          <p className="font-mono text-sm">SURVEILLANCE FEED LIVE</p>
        </div>
      </div>
    </div>
  );
}
