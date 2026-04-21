"use client";
import TopBar from "@/components/layout/TopBar";
import StatCard from "@/components/ui/StatCard";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import {
  useDashboardStats,
  useRecentActivity,
  useUpcomingDeadlines,
  useTeamPerformance,
  useProjectStatusBreakdown,
  useWeeklyTrend,
} from "@/lib/hooks/useDashboard";
import {
  Users, FolderKanban, CheckSquare, AlertCircle,
  Clock, Bell, TrendingUp, Activity, Calendar,
  ArrowRight, Target, ChevronRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { formatDate, isOverdue, timeAgo } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

/* ─── Tooltip ─────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: Record<string, unknown>) => {
  if (active && (payload as unknown[])?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3.5 py-3 text-[12.5px]">
        <div className="font-semibold text-gray-800 mb-1.5">{label as string}</div>
        {(payload as { name: string; value: number; color: string }[]).map((p) => (
          <div key={p.name} className="flex items-center gap-2 text-gray-500">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span>{p.name}:</span>
            <span className="font-semibold text-gray-800">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/* ─── Quick Action ────────────────────────────────────────── */
function QuickAction({ icon: Icon, label, href, color, bg }: { icon: typeof Users; label: string; href: string; color: string; bg: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/40 transition-all group"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
        <Icon size={15} style={{ color }} strokeWidth={1.8} />
      </div>
      <span className="text-[13px] font-medium text-gray-700 group-hover:text-indigo-700 flex-1">{label}</span>
      <ChevronRight size={13} className="text-gray-300 group-hover:text-indigo-400" />
    </Link>
  );
}

/* ─── Alert pill ─────────────────────────────────────────── */
function AlertPill({ value, label, color, icon: Icon }: { value: number; label: string; color: "red" | "amber" | "indigo"; icon: typeof AlertCircle }) {
  const styles = {
    red:    { bg: "#FEF2F2", text: "#DC2626", border: "#FCA5A5" },
    amber:  { bg: "#FFFBEB", text: "#D97706", border: "#FCD34D" },
    indigo: { bg: "#EEF2FF", text: "#4F46E5", border: "#A5B4FC" },
  }[color];
  return (
    <div className="card p-4 flex items-center gap-4" style={{ borderLeft: `3px solid ${styles.border}`, borderRadius: 12 }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: styles.bg }}>
        <Icon size={16} style={{ color: styles.text }} strokeWidth={1.8} />
      </div>
      <div>
        <div className="text-2xl font-semibold" style={{ color: styles.text }}>{value}</div>
        <div className="text-[12px] text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { data: stats, loading: statsLoading } = useDashboardStats();
  const { data: activity } = useRecentActivity();
  const { data: deadlines } = useUpcomingDeadlines();
  const { data: performance, loading: perfLoading } = useTeamPerformance();
  const { data: statusBreakdown } = useProjectStatusBreakdown();
  const { data: weeklyTrend } = useWeeklyTrend();

  if (statsLoading) return (
    <>
      <TopBar title="Dashboard" />
      <PageLoader />
    </>
  );

  const topPerformers = [...performance].sort((a, b) => b.rate - a.rate).slice(0, 3);
  const lowPerformers = [...performance].sort((a, b) => a.rate - b.rate).filter((p) => p.rate < 80).slice(0, 3);

  return (
    <>
      <TopBar title="Dashboard" subtitle={`Today is ${formatDate(new Date(), "EEEE, MMMM d")}`} />

      <div className="p-8 space-y-6 max-w-[1400px] animate-fade-in">

        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Active Clients"    value={stats.activeClients  ?? 0} icon={Users}       iconColor="#4F46E5" iconBg="#EEF2FF" />
          <StatCard label="Active Projects"   value={stats.activeProjects ?? 0} icon={FolderKanban} iconColor="#059669" iconBg="#ECFDF5" />
          <StatCard label="Pending Tasks"     value={stats.pendingTasks   ?? 0} icon={CheckSquare}  iconColor="#D97706" iconBg="#FFFBEB" />
          <StatCard label="Completed Tasks"   value={stats.completedTasks ?? 0} icon={Target}       iconColor="#0284C7" iconBg="#F0F9FF" />
        </div>

        {/* Alert row */}
        <div className="grid grid-cols-3 gap-4">
          <AlertPill value={stats.overdueTasks    ?? 0} label="Overdue Tasks"             color="red"   icon={AlertCircle} />
          <AlertPill value={stats.waitingClients  ?? 0} label="Clients Waiting for Update" color="amber" icon={Bell} />
          <AlertPill value={stats.tasksToday      ?? 0} label="Tasks Scheduled Today"      color="indigo" icon={Calendar} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Weekly trend */}
          <div className="card-lg p-5 col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[14px] font-semibold text-gray-800">Weekly Productivity</div>
                <div className="text-[12.5px] text-gray-400 mt-0.5">Tasks assigned vs completed this week</div>
              </div>
              <TrendingUp size={15} className="text-gray-300" />
            </div>
            <ResponsiveContainer width="100%" height={175}>
              <LineChart data={weeklyTrend} margin={{ left: -24, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10, color: "#6B7280" }} />
                <Line type="monotone" dataKey="assigned" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3, fill: "#4F46E5" }} name="Assigned" />
                <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: "#10B981" }} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Project status donut */}
          <div className="card-lg p-5">
            <div className="text-[14px] font-semibold text-gray-800 mb-1">Project Status</div>
            <div className="text-[12.5px] text-gray-400 mb-4">Breakdown by status</div>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={3} dataKey="value">
                  {statusBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
              {statusBreakdown.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  {s.name} <span className="text-gray-400">({s.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance + Quick Actions */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card-lg p-5 col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[14px] font-semibold text-gray-800">Team Performance</div>
                <div className="text-[12.5px] text-gray-400 mt-0.5">Expected vs actual hours per developer</div>
              </div>
              <Activity size={15} className="text-gray-300" />
            </div>
            {perfLoading ? (
              <div className="h-40 flex items-center justify-center text-[13px] text-gray-400">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height={175}>
                <BarChart data={performance} margin={{ left: -24, right: 4 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} tickFormatter={(v) => v.split(" ")[0]} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10, color: "#6B7280" }} />
                  <Bar dataKey="expected" fill="#E0E7FF" radius={[4, 4, 0, 0]} name="Expected" />
                  <Bar dataKey="actual"   fill="#4F46E5" radius={[4, 4, 0, 0]} name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card-lg p-5">
            <div className="text-[14px] font-semibold text-gray-800 mb-4">Quick Actions</div>
            <div className="space-y-2">
              <QuickAction icon={Users}       label="Add Client"   href="/clients"   color="#4F46E5" bg="#EEF2FF" />
              <QuickAction icon={FolderKanban} label="New Project" href="/projects"  color="#059669" bg="#ECFDF5" />
              <QuickAction icon={CheckSquare} label="New Task"     href="/tasks"     color="#D97706" bg="#FFFBEB" />
              <QuickAction icon={Calendar}    label="Schedule"     href="/scheduler" color="#EC4899" bg="#FDF2F8" />
              <QuickAction icon={Activity}    label="Reports"      href="/reports"   color="#0284C7" bg="#F0F9FF" />
            </div>
          </div>
        </div>

        {/* Bottom row: Performers + Deadlines + Activity */}
        <div className="grid grid-cols-3 gap-4">

          {/* Team Efficiency */}
          <div className="card-lg p-5">
            <div className="text-[14px] font-semibold text-gray-800 mb-4">Team Efficiency</div>

            <div className="section-title mb-3">Top Performers</div>
            <div className="space-y-3">
              {topPerformers.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${i === 0 ? "bg-amber-400" : i === 1 ? "bg-gray-300" : "bg-orange-300"}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-gray-800 truncate">{p.name.split(" ")[0]}</div>
                    <div className="text-[11px] text-gray-400">{p.actual}h actual</div>
                  </div>
                  <span className="text-[12px] font-semibold text-emerald-600">{p.rate}%</span>
                </div>
              ))}
            </div>

            {lowPerformers.length > 0 && (
              <>
                <div className="divider" />
                <div className="section-title mb-3">Needs Attention</div>
                <div className="space-y-3">
                  {lowPerformers.map((p) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <Clock size={13} className="text-red-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-gray-800 truncate">{p.name.split(" ")[0]}</div>
                        <div className="text-[11px] text-gray-400">{p.actual}h actual</div>
                      </div>
                      <span className="text-[12px] font-semibold text-red-500">{p.rate}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Upcoming Deadlines */}
          <div className="card-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[14px] font-semibold text-gray-800">Upcoming Deadlines</div>
              <Link href="/projects" className="flex items-center gap-1 text-[12px] text-indigo-600 hover:text-indigo-700 font-medium">
                View all <ArrowRight size={11} />
              </Link>
            </div>
            <div className="space-y-2.5">
              {deadlines.length === 0 ? (
                <p className="text-[13px] text-gray-400">No upcoming deadlines.</p>
              ) : deadlines.map((d) => {
                const overdue = isOverdue(d.due_date);
                return (
                  <Link
                    key={d.id}
                    href={`/projects/${d.id}`}
                    className="block p-3 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-gray-50/60 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-gray-800 truncate">{d.name}</div>
                        <div className="text-[11.5px] text-gray-400 mt-0.5">{(d.client as { name: string })?.name ?? "—"}</div>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                    <div className={`text-[11.5px] font-medium mt-1.5 ${overdue ? "text-red-500" : "text-amber-600"}`}>
                      {overdue ? "⚠ Overdue · " : "Due "}{formatDate(d.due_date)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[14px] font-semibold text-gray-800">Recent Activity</div>
              <Clock size={13} className="text-gray-300" />
            </div>
            <div className="space-y-4">
              {activity.map((log, i) => {
                const colorMap: Record<string, string> = {
                  completed:        "#059669",
                  status_changed:   "#4F46E5",
                  deadline_crossed: "#DC2626",
                  waiting_update:   "#D97706",
                  overdue:          "#DC2626",
                  milestone_reached:"#059669",
                  urgent:           "#D97706",
                };
                const color = colorMap[log.action as string] ?? "#9CA3AF";
                return (
                  <div key={i} className="flex gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                    <div>
                      <div className="text-[12.5px] text-gray-700 leading-snug">{log.description as string}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{timeAgo(log.created_at as string)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
