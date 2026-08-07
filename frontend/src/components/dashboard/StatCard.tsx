import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: string;
  trendPositive?: boolean;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive = true,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm transition duration-200 hover:border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>

          <div className="mt-2 flex items-baseline gap-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {value}
            </h2>
            {trend && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  trendPositive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                {trend}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="mt-2 text-sm text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/40 p-3.5 text-cyan-400 shadow-inner">
          {icon}
        </div>
      </div>
    </div>
  );
}