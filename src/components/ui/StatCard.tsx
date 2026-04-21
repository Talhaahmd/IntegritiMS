import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  className?: string;
  size?: "sm" | "md";
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = "#4F46E5",
  iconBg = "#EEF2FF",
  change,
  changeType = "neutral",
  className,
  size = "md",
}: StatCardProps) {
  const changeColors = {
    positive: "text-emerald-600 bg-emerald-50",
    negative: "text-red-500 bg-red-50",
    neutral:  "text-gray-400 bg-gray-50",
  };

  return (
    <div className={cn("card p-5 flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: iconBg }}
        >
          <Icon size={16} style={{ color: iconColor }} strokeWidth={1.8} />
        </div>
        {change && (
          <span className={cn("text-[11.5px] font-medium px-2 py-0.5 rounded-md", changeColors[changeType])}>
            {change}
          </span>
        )}
      </div>

      <div>
        <div
          className={cn("font-semibold tracking-tight leading-none", size === "sm" ? "text-2xl" : "text-[28px]")}
          style={{ color: "var(--text-primary)" }}
        >
          {value}
        </div>
        <div className="text-[12.5px] mt-1.5 text-gray-500 font-normal">{label}</div>
      </div>
    </div>
  );
}
