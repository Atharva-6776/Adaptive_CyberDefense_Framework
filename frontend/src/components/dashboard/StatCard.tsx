import type { ReactNode } from "react";
import { AnimatedCard } from "../AnimatedCard";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: string;
  trendPositive?: boolean;
  delay?: number;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive = true,
  delay = 0,
}: StatCardProps) {
  return (
    <AnimatedCard delay={delay} className="h-full">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition duration-200 hover:shadow-md flex flex-col justify-between min-h-[130px] h-full">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] truncate">
              {title}
            </p>

            <div className="mt-2 flex flex-wrap items-baseline gap-2 min-w-0">
              <h2
                className="font-bold text-[var(--text-primary)] tracking-tight break-all"
                style={{ fontSize: "clamp(1rem, 2.5vw, 1.5rem)", lineHeight: "1.3" }}
              >
                {value}
              </h2>
              {trend && (
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight whitespace-nowrap border ${
                    trendPositive
                      ? "bg-[rgba(30,142,90,0.1)] text-[var(--success)] border-[rgba(30,142,90,0.2)]"
                      : "bg-[rgba(201,79,79,0.1)] text-[var(--danger)] border-[rgba(201,79,79,0.2)]"
                  }`}
                >
                  {trend}
                </span>
              )}
            </div>

            {subtitle && (
              <p className="mt-1.5 text-xs text-[var(--text-secondary)] break-words">
                {subtitle}
              </p>
            )}
          </div>

          <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[#F7F7F5] shadow-inner text-[var(--text-secondary)]">
            {icon}
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
}
