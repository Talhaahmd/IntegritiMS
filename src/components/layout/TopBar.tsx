"use client";
import { Bell, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 60,
        padding: "0 28px",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border)",
        gap: 16,
      }}
    >
      {/* ── Left: Page title ── */}
      <div style={{ minWidth: 0 }}>
        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.4px",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: 12,
              color: "var(--text-tertiary)",
              marginTop: 1,
              fontWeight: 400,
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* ── Right: actions ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>

        {/* Date pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 34,
            padding: "0 12px",
            borderRadius: 8,
            background: "var(--surface-2)",
            border: "1.5px solid var(--border)",
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--text-secondary)",
            letterSpacing: "-0.1px",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          <Calendar size={12} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          {formatDate(new Date(), "EEE, MMM d")}
        </div>

        {/* Bell */}
        <button
          style={{
            position: "relative",
            width: 34,
            height: 34,
            borderRadius: 8,
            border: "1.5px solid var(--border)",
            background: "var(--surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-secondary)",
            transition: "background 0.15s, border-color 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--surface-2)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
          title="Notifications"
        >
          <Bell size={14} />
          {/* Notification dot */}
          <span
            style={{
              position: "absolute",
              top: 7,
              right: 7,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#EF4444",
              border: "1.5px solid #fff",
            }}
          />
        </button>
      </div>
    </header>
  );
}
