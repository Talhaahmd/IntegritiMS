"use client";
import { cn } from "@/lib/utils";

export default function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative flex items-center justify-center">
        <div 
          className="w-8 h-8 rounded-full border-[3px]" 
          style={{ 
            borderColor: "var(--accent-light)", 
            borderTopColor: "var(--accent)", 
            animation: "spin 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite" 
          }} 
        />
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 animate-fade-in">
      <div className="relative">
        {/* Outer Glow */}
        <div 
          className="absolute inset-0 rounded-full blur-2xl" 
          style={{ background: "var(--accent)", opacity: 0.1, animation: "pulse-subtle 2s infinite ease-in-out" }} 
        />
        
        {/* Spinner Ring */}
        <div 
          className="w-20 h-20 rounded-full border-[2.5px]" 
          style={{ 
            borderColor: "var(--border-subtle)", 
            borderTopColor: "var(--accent)", 
            animation: "spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite" 
          }} 
        />
        
        {/* Logo Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 p-1 bg-white rounded-full shadow-sm animate-pulse">
            <img src="/logo.webp" alt="Loading Logo" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <div 
          style={{ 
            fontSize: 14, 
            fontWeight: 700, 
            color: "var(--text-primary)", 
            letterSpacing: "-0.2px" 
          }}
        >
          Integriti 
        </div>
        <div 
          style={{ 
            fontSize: 12, 
            color: "var(--text-tertiary)",
            fontWeight: 500
          }}
        >
          Initializing your operations hub...
        </div>
      </div>

      {/* Mini Progress Bar */}
      <div 
        className="w-44 h-1.5 rounded-full overflow-hidden" 
        style={{ background: "var(--surface-2)" }}
      >
        <div 
          className="h-full rounded-full" 
          style={{ 
            background: "var(--accent)", 
            width: "30%", 
            animation: "loader-progress 2.2s infinite ease-in-out" 
          }} 
        />
      </div>
    </div>
  );
}
