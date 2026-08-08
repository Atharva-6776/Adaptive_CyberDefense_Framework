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
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-sm transition duration-200 hover:border-slate-700 flex flex-col justify-between min-h-[130px]">
      <div className="flex items-start justify-between gap-3 min-w-0">
        {/* Text content – must shrink, never overflow */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
            {title}
          </p>

          {/* Value row */}
          <div className="mt-2 flex flex-wrap items-baseline gap-2 min-w-0">
            <h2
              className="font-bold text-white tracking-tight break-all"
              style={{ fontSize: "clamp(1rem, 2.5vw, 1.5rem)", lineHeight: "1.3" }}
            >
              {value}
            </h2>
            {trend && (
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight whitespace-nowrap border ${
                  trendPositive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {trend}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="mt-1.5 text-xs text-slate-400 break-words">
              {subtitle}
            </p>
          )}
        </div>

        {/* Icon container – fixed size, never squishes text */}
        <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-950/40 shadow-inner">
          {icon}
        </div>
      </div>
    </div>
  );
}