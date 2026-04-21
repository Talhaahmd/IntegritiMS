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
  Zap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const NAV: { href: string; icon: React.ElementType; label: string; highlight?: boolean }[] = [
  { href: "/",            icon: LayoutDashboard, label: "Dashboard" },
  { href: "/clients",     icon: Users,           label: "Clients" },
  { href: "/projects",    icon: FolderKanban,    label: "Projects" },
  { href: "/team",        icon: UserCog,         label: "Team" },
  { href: "/scheduler",   icon: CalendarDays,    label: "Scheduler" },
  { href: "/tasks",       icon: CheckSquare,     label: "Tasks" },
  { href: "/reports",     icon: BarChart3,       label: "Reports" },
  { href: "/ai-manager",  icon: Sparkles,        label: "AI Manager", highlight: true },
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
    <aside
      className="flex flex-col fixed left-0 top-0 bottom-0 z-30 bg-white border-r border-gray-100 transition-all duration-300"
      style={{ width: collapsed ? 60 : 240 }}
    >
      {/* Brand */}
      <div className="flex items-center h-[60px] border-b border-gray-100 px-3.5 shrink-0 overflow-hidden">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <Zap size={13} color="white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="ml-2.5 overflow-hidden">
            <div className="text-[13.5px] font-semibold text-gray-900 tracking-tight leading-none whitespace-nowrap">
              IntegritiMS
            </div>
            <div className="text-[10.5px] text-gray-400 mt-0.5 leading-none">Operations Hub</div>
          </div>
        )}
        {/* Toggle button */}
        <button
          onClick={onToggle}
          className={cn(
            "ml-auto flex items-center justify-center w-6 h-6 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0",
            collapsed && "mx-auto ml-auto"
          )}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="px-2 mb-2 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
            Menu
          </p>
        )}
        {NAV.map(({ href, icon: Icon, label, highlight }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group overflow-hidden",
                collapsed ? "px-0 py-2 justify-center" : "px-3 py-2",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : highlight && !active
                  ? "text-indigo-600 hover:bg-indigo-50"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon
                size={15}
                strokeWidth={active ? 2.2 : 1.8}
                className={cn(
                  "shrink-0",
                  active ? "text-indigo-600"
                  : highlight ? "text-indigo-500"
                  : "text-gray-400 group-hover:text-gray-600"
                )}
              />
              {!collapsed && <span className="truncate">{label}</span>}
              {!collapsed && highlight && !active && (
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">AI</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-3 border-t border-gray-100 pt-3 space-y-0.5 shrink-0 overflow-hidden">
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group",
            collapsed ? "px-0 py-2 justify-center" : "px-3 py-2",
            isActive("/settings")
              ? "bg-indigo-50 text-indigo-700"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <Settings
            size={15}
            strokeWidth={isActive("/settings") ? 2.2 : 1.8}
            className={cn("shrink-0", isActive("/settings") ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600")}
          />
          {!collapsed && <span>Settings</span>}
        </Link>

        {/* Admin pill */}
        {collapsed ? (
          <div className="flex justify-center mt-2">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
              A
            </div>
          </div>
        ) : (
          <div className="mt-2 mx-1 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                A
              </div>
              <div className="min-w-0">
                <div className="text-[12.5px] font-medium text-gray-800 leading-none">Admin</div>
                <div className="text-[10.5px] text-gray-400 mt-0.5 truncate">admin@integritims.com</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
