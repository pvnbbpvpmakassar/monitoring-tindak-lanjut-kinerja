
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  color: "blue" | "amber" | "green" | "red";
  format?: "number" | "currency";
}

const colorStyles = {
  blue: {
    icon: "bg-blue-50 text-blue-700",
    accent: "bg-blue-600",
  },
  amber: {
    icon: "bg-amber-50 text-amber-700",
    accent: "bg-amber-500",
  },
  green: {
    icon: "bg-green-50 text-green-700",
    accent: "bg-green-600",
  },
  red: {
    icon: "bg-red-50 text-red-700",
    accent: "bg-red-600",
  },
};

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  format = "number",
}: StatCardProps) {
  const displayValue =
    format === "currency"
      ? new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(value)
      : new Intl.NumberFormat("id-ID").format(value);

  const styles = colorStyles[color];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md sm:p-6">
      <div
        className={`absolute inset-x-0 top-0 h-1 ${styles.accent}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h2
            className={`mt-3 break-words font-bold tracking-tight text-[#172b42] ${
              format === "currency"
                ? "text-2xl sm:text-[28px]"
                : "text-3xl"
            }`}
          >
            {displayValue}
          </h2>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          <Icon size={21} strokeWidth={1.9} />
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-400">
        {description}
      </p>
    </div>
  );
}
