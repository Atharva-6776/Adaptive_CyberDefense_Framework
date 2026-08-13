import { useEffect, useState } from "react";
import { Camera as CameraIcon, Plus, ShieldAlert, Loader2, Play, Square, RefreshCw } from "lucide-react";
import CameraCard from "../components/camera/CameraCard";
import CameraDetailModal from "../components/camera/CameraDetailModal";
import { getCameras, createCamera, startCameraStream, stopCameraStream } from "../api/video";
import type { Camera } from "../types/dashboard";
import { toast } from "sonner";

export default function Cameras() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for adding camera
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newCamName, setNewCamName] = useState("");
  const [newCamLocation, setNewCamLocation] = useState("");
  const [newCamIp, setNewCamIp] = useState("192.168.1.100");
  const [newCamStreamUrl, setNewCamStreamUrl] = useState("0"); // default webcam
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCameras = async () => {
    try {
      setError(null);
      const data = await getCameras();
      setCameras(data);
      // Update selected camera reference if open
      if (selectedCamera) {
        const updated = data.find((c) => c.id === selectedCamera.id);
        if (updated) setSelectedCamera(updated);
      }
    } catch (err: any) {
      setError("Failed to load camera data from backend.");
      toast.error("Error connecting to video API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
    // Poll cameras status every 5 seconds
    const interval = setInterval(fetchCameras, 5000);
    return () => clearInterval(interval);
  }, [selectedCamera]);

  const handleRegisterCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamName || !newCamLocation) {
      toast.error("Please provide a name and location");
      return;
    }
    setIsSubmitting(true);
    try {
      await createCamera({
        name: newCamName,
        location: newCamLocation,
        ip_address: newCamIp,
        stream_url: newCamStreamUrl,
        resolution: "1920x1080",
        fps: 15,
        stream_type: newCamStreamUrl === "0" ? "Webcam / MJPEG" : "RTSP / H.264"
      });
      toast.success("Camera registered successfully!");
      setNewCamName("");
      setNewCamLocation("");
      setShowAddForm(false);
      fetchCameras();
    } catch (err) {
      toast.error("Failed to register new camera");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleIngestion = async (camera: Camera) => {
    const isOnline = camera.status === "online";
    const toastId = toast.loading(`${isOnline ? "Stopping" : "Starting"} stream for ${camera.name}...`);
    try {
      if (isOnline) {
        await stopCameraStream(camera.id);
        toast.success(`Ingestion stream stopped for ${camera.name}`, { id: toastId });
      } else {
        await startCameraStream(camera.id);
        toast.success(`Ingestion stream started for ${camera.name}`, { id: toastId });
      }
      fetchCameras();
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || `Failed to toggle camera stream`;
      toast.error(errMsg, { id: toastId });
    }
  };

  return (
    <div className="space-y-8 text-white">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Surveillance Camera Network
            </h1>
            {!error && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-400">
                Connected
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Monitor camera stream health, resolution settings, frame rates & optical violations.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 active:scale-95 shadow-lg shadow-cyan-950/40"
          >
            <Plus className="h-4 w-4" />
            Register Camera
          </button>
          <button
            onClick={fetchCameras}
            className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-slate-400 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Add Camera Form Panel */}
      {showAddForm && (
        <form
          onSubmit={handleRegisterCamera}
          className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4 max-w-xl animate-in slide-in-from-top duration-200"
        >
          <h3 className="text-base font-bold text-white">Register New Surveillance Camera</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Camera Name</label>
              <input
                type="text"
                required
                placeholder="Vault Alpha Entrance"
                value={newCamName}
                onChange={(e) => setNewCamName(e.target.value)}
                className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Location</label>
              <input
                type="text"
                required
                placeholder="Building B - Perimeter"
                value={newCamLocation}
                onChange={(e) => setNewCamLocation(e.target.value)}
                className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">IP Address</label>
              <input
                type="text"
                placeholder="192.168.1.100"
                value={newCamIp}
                onChange={(e) => setNewCamIp(e.target.value)}
                className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Stream Source URL / Webcam ID</label>
              <input
                type="text"
                placeholder="0 (Webcam), or filepath, or RTSP link"
                value={newCamStreamUrl}
                onChange={(e) => setNewCamStreamUrl(e.target.value)}
                className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded px-4 py-2 text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
            >
              {isSubmitting ? "Registering..." : "Add Camera"}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-sm text-slate-400">Fetching surveillance nodes...</p>
        </div>
      ) : cameras.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cameras.map((camera) => (
            <div key={camera.id} className="relative">
              <CameraCard
                camera={camera}
                onOpenDetails={setSelectedCamera}
              />
              
              {/* Stream toggle quick overlay button */}
              <button
                onClick={() => handleToggleIngestion(camera)}
                title={camera.status === "online" ? "Stop stream ingestion" : "Start stream ingestion"}
                className={`absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border shadow transition-transform duration-200 active:scale-90 ${
                  camera.status === "online"
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                }`}
              >
                {camera.status === "online" ? (
                  <Square className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current" />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/90 p-12 text-center shadow-xl space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-slate-500">
            <CameraIcon className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">No Cameras Deployed</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Register a camera stream (such as a local webcam or sample MP4 video file) to initiate safety surveillance.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
          >
            Register First Camera
          </button>
        </div>
      )}

      {/* Details modal */}
      <CameraDetailModal
        camera={selectedCamera}
        onClose={() => setSelectedCamera(null)}
      />
    </div>
  );
}