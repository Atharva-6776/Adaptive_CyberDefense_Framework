import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Camera,
  TriangleAlert,
  Shield,
  FileBarChart,
  Settings,
  LogOut,
} from "lucide-react";

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

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-6">
          <h1 className="text-xl font-bold text-cyan-400">
            Adaptive Cyber Defense
          </h1>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                  location.pathname === item.path
                    ? "bg-cyan-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}

          <button className="mt-10 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-400 hover:bg-red-900/20">
            <LogOut size={20} />
            Logout
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-8">
          <h2 className="text-lg font-semibold">Dashboard</h2>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-cyan-600"></div>

            <div>
              <p className="font-medium">Administrator</p>
              <p className="text-sm text-slate-400">
                admin@example.com
              </p>
            </div>
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}