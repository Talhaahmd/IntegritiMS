import { cn } from "@/lib/utils";

type Variant = "slate" | "indigo" | "emerald" | "amber" | "red" | "sky" | "violet" | "orange" | "teal" | "pink";

const VARIANT_CLASSES: Record<Variant, string> = {
  slate:   "bg-gray-100 text-gray-600",
  indigo:  "bg-indigo-50 text-indigo-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber:   "bg-amber-50 text-amber-700",
  red:     "bg-red-50 text-red-600",
  sky:     "bg-sky-50 text-sky-700",
  violet:  "bg-violet-50 text-violet-700",
  orange:  "bg-orange-50 text-orange-700",
  teal:    "bg-teal-50 text-teal-700",
  pink:    "bg-pink-50 text-pink-700",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  dot?: boolean;
  className?: string;
}

export default function Badge({ children, variant = "slate", dot = false, className }: BadgeProps) {
  return (
    <span className={cn("badge font-medium", VARIANT_CLASSES[variant], className)}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "currentColor", opacity: 0.65 }} />
      )}
      {children}
    </span>
  );
}
