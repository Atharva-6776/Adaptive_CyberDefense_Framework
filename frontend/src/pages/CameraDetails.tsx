import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function CameraDetails() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 text-white">
      <button
        onClick={() => navigate("/cameras")}
        className="flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cameras Grid
      </button>

      {/* Backend Integration Pending Notice */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/90 p-12 text-center shadow-xl space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-amber-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Backend integration pending</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Individual camera stream detail endpoints (`/api/v1/video/cameras/:id`) are not available on the FastAPI backend yet.
          </p>
        </div>
      </div>
    </div>
  );
}
