import { LucideIcon } from "lucide-react";
import clsx from "clsx";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: "default" | "positive" | "negative" | "warning";
  hint?: string;
}) {
  const toneClasses: Record<string, string> = {
    default: "text-gray-900 dark:text-gray-100",
    positive: "text-emerald-600 dark:text-emerald-400",
    negative: "text-red-600 dark:text-red-400",
    warning: "text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        {Icon && <Icon size={18} className="text-gray-400 dark:text-gray-500" />}
      </div>
      <p className={clsx("mt-2 text-2xl font-semibold", toneClasses[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}
