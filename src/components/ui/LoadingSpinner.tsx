import { cn } from "@/lib/utils";

export default function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <div
        className="w-8 h-8 rounded-full border-2 border-t-indigo-500"
        style={{
          borderColor: "var(--border)",
          borderTopColor: "var(--accent)",
          animation: "spin 0.7s linear infinite",
        }}
      />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div
        className="w-9 h-9 rounded-full border-2"
        style={{
          borderColor: "var(--border)",
          borderTopColor: "var(--accent)",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <div className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>Loading…</div>
    </div>
  );
}
