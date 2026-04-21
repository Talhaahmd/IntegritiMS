import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  color?: "indigo" | "emerald" | "amber" | "red";
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

const COLOR_MAP = {
  indigo:  "bg-indigo-500",
  emerald: "bg-emerald-500",
  amber:   "bg-amber-400",
  red:     "bg-red-400",
};

export default function ProgressBar({ value, color = "indigo", size = "sm", showLabel = false, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const c = clamped >= 70 ? "emerald" : clamped >= 35 ? color : "amber";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn("progress-bar flex-1", size === "md" ? "h-2" : "h-1.5")}
        style={{ background: "#EEF2FF" }}
      >
        <div
          className={cn("progress-bar-fill", COLOR_MAP[c])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[12px] font-medium tabular-nums text-gray-500 min-w-[30px] text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
}
