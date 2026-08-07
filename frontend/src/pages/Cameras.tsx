import { useState } from "react";
import { Camera as CameraIcon, Search, Filter, Plus } from "lucide-react";
import CameraCard from "../components/camera/CameraCard";
import CameraDetailModal from "../components/camera/CameraDetailModal";
import { MOCK_CAMERAS } from "../data/dashboard";
import type { Camera } from "../types/dashboard";
import { toast } from "sonner";

export default function Cameras() {
  const [cameras] = useState<Camera[]>(MOCK_CAMERAS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

  const filteredCameras = cameras.filter((cam) => {
    const matchesSearch =
      cam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cam.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cam.ipAddress.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || cam.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleAddCamera = () => {
    toast.info("Add Camera wizard opened (mock UI). API connection will follow.");
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Surveillance Camera Network
            </h1>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-0.5 text-xs font-semibold text-cyan-400">
              {cameras.length} Endpoints
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Monitor camera stream health, resolution settings, frame rates & optical violations.
          </p>
        </div>

        <button
          onClick={handleAddCamera}
          className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-cyan-500 active:scale-95 shadow-lg shadow-cyan-950/40"
        >
          <Plus className="h-4 w-4" />
          Add New Camera
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by camera name, location, or IP..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">All Statuses ({cameras.length})</option>
            <option value="online">
              Online ({cameras.filter((c) => c.status === "online").length})
            </option>
            <option value="warning">
              Warning ({cameras.filter((c) => c.status === "warning").length})
            </option>
            <option value="offline">
              Offline ({cameras.filter((c) => c.status === "offline").length})
            </option>
          </select>
        </div>
      </div>

      {/* Cameras Grid */}
      {filteredCameras.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCameras.map((cam) => (
            <CameraCard
              key={cam.id}
              camera={cam}
              onOpenDetails={(camera) => setSelectedCamera(camera)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
          <CameraIcon className="h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No Cameras Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            No camera matches query "{searchTerm}". Try adjusting search terms or filters.
          </p>
        </div>
      )}

      {/* Camera Details Modal */}
      <CameraDetailModal
        camera={selectedCamera}
        onClose={() => setSelectedCamera(null)}
      />
    </div>
  );
}