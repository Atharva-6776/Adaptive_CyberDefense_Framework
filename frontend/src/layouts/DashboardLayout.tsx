<<<<<<< HEAD
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Camera,
  TriangleAlert,
  Shield,
  Activity,
  FileBarChart,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { logoutApi } from "../api/auth";

const menuItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Cameras", path: "/cameras", icon: Camera },
  { name: "Alerts", path: "/alerts", icon: TriangleAlert },
  { name: "Security", path: "/security", icon: Shield },
  { name: "Threat Analytics", path: "/threats", icon: Activity },
  { name: "Reports", path: "/reports", icon: FileBarChart },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    await logoutApi();
    navigate("/login");
  };

  const displayEmail = user?.email || "Unknown user";
  const displayRole = user?.role ? user.role.toUpperCase() : "NO ROLE";
  const avatarLetter = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    /* Root: full viewport, no overflow */
    <div className="flex h-screen overflow-hidden bg-slate-950 text-white">

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-800 bg-slate-900 overflow-y-auto">
        {/* Brand */}
        <div className="border-b border-slate-800 px-5 py-5">
          <h1 className="text-base font-bold leading-tight text-cyan-400">
            Adaptive Cyber Defense
          </h1>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 p-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-cyan-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout — pinned at bottom */}
        <div className="border-t border-slate-800 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/20 hover:text-red-300"
          >
            <LogOut size={18} className="shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Top header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
          <h2 className="truncate text-base font-semibold text-white">
            Dashboard
          </h2>

          {/* User identity — constrained so it never overflows */}
          <div className="ml-4 flex min-w-0 shrink items-center gap-3">
            {/* Avatar circle */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-sm font-bold text-white">
              {avatarLetter}
            </div>

            {/* Email + role — min-w-0 lets this block shrink */}
            <div className="min-w-0 text-right">
              <p
                className="max-w-[180px] truncate text-sm font-medium text-slate-200"
                title={displayEmail}
              >
                {displayEmail}
              </p>
              <p className="text-[11px] font-semibold tracking-wider text-cyan-400">
                {displayRole}
              </p>
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-screen-2xl px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
=======
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Camera,
  TriangleAlert,
  Shield,
  FileBarChart,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { logoutApi } from "../api/auth";
import { CyberDefenseBackground } from "../components/3d/CyberDefenseBackground";
import { useScrollProgress } from "../components/3d/useScrollProgress";

const menuItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Cameras", path: "/cameras", icon: Camera },
  { name: "Alerts", path: "/alerts", icon: TriangleAlert },
  { name: "Security", path: "/security", icon: Shield },
  { name: "Reports", path: "/reports", icon: FileBarChart },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { scrollProgress, scrollRef } = useScrollProgress();

  const handleLogout = async () => {
    await logoutApi();
    navigate("/login");
  };

  const displayEmail = user?.email || "Unknown user";
  const displayRole = user?.role ? user.role.toUpperCase() : "NO ROLE";
  const avatarLetter = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    /* Root: full viewport, no overflow */
    <div className="relative flex h-screen overflow-hidden bg-slate-950/80 text-white">
      {/* Premium 3D Scroll-Reactive Background Canvas */}
      <CyberDefenseBackground scrollProgress={scrollProgress} />

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="relative z-10 flex w-60 shrink-0 flex-col border-r border-slate-800 bg-slate-900/90 backdrop-blur-md overflow-y-auto">
        {/* Brand */}
        <div className="border-b border-slate-800 px-5 py-5">
          <h1 className="text-base font-bold leading-tight text-cyan-400">
            Adaptive Cyber Defense
          </h1>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 p-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-cyan-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout — pinned at bottom */}
        <div className="border-t border-slate-800 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/20 hover:text-red-300"
          >
            <LogOut size={18} className="shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────── */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Top header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6">
          <h2 className="truncate text-base font-semibold text-white">
            Dashboard
          </h2>

          {/* User identity — constrained so it never overflows */}
          <div className="ml-4 flex min-w-0 shrink items-center gap-3">
            {/* Avatar circle */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-sm font-bold text-white">
              {avatarLetter}
            </div>

            {/* Email + role — min-w-0 lets this block shrink */}
            <div className="min-w-0 text-right">
              <p
                className="max-w-[180px] truncate text-sm font-medium text-slate-200"
                title={displayEmail}
              >
                {displayEmail}
              </p>
              <p className="text-[11px] font-semibold tracking-wider text-cyan-400">
                {displayRole}
              </p>
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-screen-2xl px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
>>>>>>> origin/main
