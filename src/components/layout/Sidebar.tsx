"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  UserCog,
  CalendarDays,
  CheckSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MAIN_NAV: { href: string; icon: React.ElementType; label: string; highlight?: boolean }[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/projects", icon: FolderKanban, label: "Projects" },
  { href: "/team", icon: UserCog, label: "Team" },
  { href: "/scheduler", icon: CalendarDays, label: "Scheduler" },
  { href: "/tasks", icon: CheckSquare, label: "Tasks" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/ai-manager", icon: Sparkles, label: "AI Manager", highlight: true },
];

const SETTINGS_NAV: { href: string; icon: React.ElementType; label: string }[] = [
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <motion.aside
      initial={false}
      animate={{
        width: collapsed ? 64 : 248,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }}
      className="flex flex-col fixed left-0 top-0 bottom-0 z-30"
      style={{
        background: "#FAFAFA",
        borderRight: "1px solid #EBEBEB",
      }}
    >
      {/* ── Brand ── */}
      <div
        className="flex items-center shrink-0 overflow-hidden"
        style={{ height: 64, padding: collapsed ? "0 18px" : "0 20px", gap: 12 }}
      >
        <button
          onClick={onToggle}
          className="flex items-center justify-center shrink-0 rounded-xl hover:scale-105 active:scale-95 transition-all outline-none"
          style={{ width: 34, height: 34, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <img src="/logo.webp" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </button>

        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden flex-1"
            >
              <div
                style={{ fontSize: 14.5, fontWeight: 700, color: "#111827", letterSpacing: "-0.3px", lineHeight: 1 }}
              >
                Integriti
              </div>
              <div
                style={{ fontSize: 11, fontWeight: 400, color: "#9CA3AF", marginTop: 6, lineHeight: 1 }}
              >
                Operations Hub
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle */}
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center justify-center rounded-lg transition-colors",
            collapsed ? "mx-auto mt-0" : "ml-auto"
          )}
          style={{
            width: 26,
            height: 26,
            color: "#9CA3AF",
            marginLeft: collapsed ? undefined : "auto",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#EFEFEF")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden" style={{ padding: collapsed ? "12px 10px" : "16px 12px 12px" }}>
        {/* {!collapsed && (
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#B0B7C3",
              padding: "10px 8px 6px",
            }}
          >
            Main Menu
          </p>
        )} */}

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {MAIN_NAV.map(({ href, icon: Icon, label, highlight }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className="flex items-center rounded-lg transition-all duration-150 group overflow-hidden"
                style={{
                  gap: collapsed ? 0 : 10,
                  padding: collapsed ? "9px 0" : "9px 10px",
                  justifyContent: collapsed ? "center" : undefined,
                  background: active ? "#EEF2FF" : "transparent",
                  color: active
                    ? "#4F46E5"
                    : highlight
                      ? "#4F46E5"
                      : "#4B5563",
                  fontWeight: active ? 600 : 500,
                  fontSize: 13.5,
                  textDecoration: "none",
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.background = "#F0F0F0";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = active ? "#EEF2FF" : "transparent";
                }}
              >
                <Icon
                  size={16}
                  strokeWidth={active ? 2.2 : 1.8}
                  style={{
                    flexShrink: 0,
                    color: active
                      ? "#4F46E5"
                      : highlight
                        ? "#818CF8"
                        : "#9CA3AF",
                    transition: "color 0.15s",
                  }}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden" }}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!collapsed && highlight && !active && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      background: "#EEF2FF",
                      color: "#6366F1",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    AI
                  </motion.span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Settings Section ── */}
      <div
        style={{
          padding: collapsed ? "10px 10px" : "10px 12px",
          borderTop: "1px solid #EBEBEB",
        }}
      >
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#B0B7C3",
                padding: "8px 8px 6px",
                whiteSpace: "nowrap",
                overflow: "hidden"
              }}
            >
              Settings
            </motion.p>
          )}
        </AnimatePresence>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {SETTINGS_NAV.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className="flex items-center rounded-lg transition-all duration-150 group overflow-hidden"
                style={{
                  gap: collapsed ? 0 : 10,
                  padding: collapsed ? "9px 0" : "9px 10px",
                  justifyContent: collapsed ? "center" : undefined,
                  background: active ? "#EEF2FF" : "transparent",
                  color: active ? "#4F46E5" : "#4B5563",
                  fontWeight: active ? 600 : 500,
                  fontSize: 13.5,
                  textDecoration: "none",
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.background = "#F0F0F0";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = active ? "#EEF2FF" : "transparent";
                }}
              >
                <Icon
                  size={16}
                  strokeWidth={active ? 2.2 : 1.8}
                  style={{
                    flexShrink: 0,
                    color: active ? "#4F46E5" : "#9CA3AF",
                    transition: "color 0.15s",
                  }}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden" }}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}

        </div>
      </div>

      {/* ── User Footer ── */}
      <div
        style={{
          padding: collapsed ? "12px 10px" : "12px 16px",
          borderTop: "1px solid #EBEBEB",
          background: "#F5F5F5",
        }}
      >
        <div className="relative h-8">
          <AnimatePresence mode="wait">
            {collapsed ? (
              <motion.div
                key="collapsed-user"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex justify-center"
              >
                <div
                  className="flex items-center justify-center rounded-full text-white font-bold"
                  style={{ width: 32, height: 32, background: "#4F46E5", fontSize: 12 }}
                >
                  A
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="expanded-user"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center"
                style={{ gap: 10 }}
              >
                <div
                  className="flex items-center justify-center rounded-full text-white font-bold shrink-0"
                  style={{ width: 32, height: 32, background: "#4F46E5", fontSize: 12 }}
                >
                  A
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    className="font-semibold truncate"
                    style={{ fontSize: 13, color: "#111827", letterSpacing: "-0.1px" }}
                  >
                    Admin
                  </div>
                  <div
                    className="truncate"
                    style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}
                  >
                    admin@integritims.com
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
