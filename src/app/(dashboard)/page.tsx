"use client";
import TopBar from "@/components/layout/TopBar";
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

/* ─── Tooltip ──────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: Record<string, unknown>) => {
  if (active && (payload as unknown[])?.length) {
    return (
      <div style={{
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 12.5,
        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
      }}>
        <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{label as string}</div>
        {(payload as { name: string; value: number; color: string }[]).map((p) => (
          <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--text-secondary)", marginBottom: 2 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, flexShrink: 0, display: "inline-block" }} />
            <span>{p.name}:</span>
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/* ─── Quick Action ─────────────────────────────────────────── */
function QuickAction({ icon: Icon, label, href, color, bg }: { icon: typeof Users; label: string; href: string; color: string; bg: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid var(--border)",
        textDecoration: "none",
        transition: "border-color 0.15s, background 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#C7D2FE";
        (e.currentTarget as HTMLElement).style.background = "#F5F7FF";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={14} style={{ color }} strokeWidth={1.8} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", flex: 1 }}>{label}</span>
      <ChevronRight size={13} style={{ color: "var(--text-tertiary)" }} />
    </Link>
  );
}

/* ─── KPI Card ─────────────────────────────────────────────── */
function KpiCard({ label, value, icon: Icon, iconColor, iconBg }: {
  label: string; value: number; icon: typeof Users; iconColor: string; iconBg: string;
}) {
  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={16} style={{ color: iconColor }} strokeWidth={1.8} />
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-1px", color: "var(--text-primary)", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 5, fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

/* ─── Alert Pill ───────────────────────────────────────────── */
function AlertPill({ value, label, color, icon: Icon }: {
  value: number; label: string; color: "red" | "amber" | "indigo"; icon: typeof AlertCircle;
}) {
  const styles = {
    red:    { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA",  leftBar: "#EF4444" },
    amber:  { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A",  leftBar: "#F59E0B" },
    indigo: { bg: "#EEF2FF", text: "#4F46E5", border: "#C7D2FE",  leftBar: "#6366F1" },
  }[color];

  return (
    <div
      className="card"
      style={{
        padding: "14px 18px",
        display: "flex", alignItems: "center", gap: 14,
        borderLeft: `3px solid ${styles.leftBar}`,
        borderRadius: 12,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: styles.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={15} style={{ color: styles.text }} strokeWidth={1.8} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", color: styles.text, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, fontWeight: 500 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

/* ─── Section Header ───────────────────────────────────────── */
function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.2px" }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
      {action}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────── */
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

  const rankColors = ["#F59E0B", "#94A3B8", "#F97316"];

  return (
    <>
      <TopBar title="Dashboard" subtitle={`Today is ${formatDate(new Date(), "EEEE, MMMM d")}`} />

      <div style={{ padding: "24px 28px 40px", maxWidth: 1440 }} className="animate-fade-in">

        {/* ── KPI Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
          <KpiCard label="Active Clients"   value={stats.activeClients ?? 0}   icon={Users}       iconColor="#4F46E5" iconBg="#EEF2FF" />
          <KpiCard label="Active Projects"  value={stats.activeProjects ?? 0}  icon={FolderKanban} iconColor="#059669" iconBg="#ECFDF5" />
          <KpiCard label="Pending Tasks"    value={stats.pendingTasks ?? 0}    icon={CheckSquare} iconColor="#D97706" iconBg="#FFFBEB" />
          <KpiCard label="Completed Tasks"  value={stats.completedTasks ?? 0}  icon={Target}      iconColor="#0284C7" iconBg="#F0F9FF" />
        </div>

        {/* ── Alert Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
          <AlertPill value={stats.overdueTasks ?? 0}   label="Overdue Tasks"               color="red"    icon={AlertCircle} />
          <AlertPill value={stats.waitingClients ?? 0} label="Clients Waiting for Update"  color="amber"  icon={Bell} />
          <AlertPill value={stats.tasksToday ?? 0}     label="Tasks Scheduled Today"       color="indigo" icon={Calendar} />
        </div>

        {/* ── Charts Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>

          {/* Weekly Productivity — spans 2 cols */}
          <div className="card-lg" style={{ padding: "20px 22px", gridColumn: "span 2" }}>
            <SectionHeader
              title="Weekly Productivity"
              subtitle="Tasks assigned vs completed this week"
              action={<TrendingUp size={15} style={{ color: "var(--text-tertiary)" }} />}
            />
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weeklyTrend} margin={{ left: -24, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: "#6B7280" }} />
                <Line type="monotone" dataKey="assigned"  stroke="#4F46E5" strokeWidth={2.5} dot={{ r: 3.5, fill: "#4F46E5", strokeWidth: 0 }} name="Assigned" />
                <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3.5, fill: "#10B981", strokeWidth: 0 }} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Project Status Donut */}
          <div className="card-lg" style={{ padding: "20px 22px" }}>
            <SectionHeader title="Project Status" subtitle="Breakdown by status" />
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%" cy="50%"
                  innerRadius={44} outerRadius={66}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {statusBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 10 }}>
              {statusBreakdown.map((s) => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--text-secondary)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block", flexShrink: 0 }} />
                  {s.name}
                  <span style={{ color: "var(--text-tertiary)" }}>({s.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Performance + Quick Actions ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>

          {/* Team Performance bar chart — spans 2 */}
          <div className="card-lg" style={{ padding: "20px 22px", gridColumn: "span 2" }}>
            <SectionHeader
              title="Team Performance"
              subtitle="Expected vs actual hours per developer"
              action={<Activity size={15} style={{ color: "var(--text-tertiary)" }} />}
            />
            {perfLoading ? (
              <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--text-tertiary)" }}>
                Loading…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={performance} margin={{ left: -24, right: 4 }} barCategoryGap="32%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} tickFormatter={(v) => v.split(" ")[0]} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: "#6B7280" }} />
                  <Bar dataKey="expected" fill="#E0E7FF" radius={[5, 5, 0, 0]} name="Expected" />
                  <Bar dataKey="actual"   fill="#4F46E5" radius={[5, 5, 0, 0]} name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card-lg" style={{ padding: "20px 22px" }}>
            <SectionHeader title="Quick Actions" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <QuickAction icon={Users}       label="Add Client"    href="/clients"   color="#4F46E5" bg="#EEF2FF" />
              <QuickAction icon={FolderKanban} label="New Project"  href="/projects"  color="#059669" bg="#ECFDF5" />
              <QuickAction icon={CheckSquare} label="New Task"      href="/tasks"     color="#D97706" bg="#FFFBEB" />
              <QuickAction icon={Calendar}    label="Schedule"      href="/scheduler" color="#EC4899" bg="#FDF2F8" />
              <QuickAction icon={Activity}    label="Reports"       href="/reports"   color="#0284C7" bg="#F0F9FF" />
            </div>
          </div>
        </div>

        {/* ── Bottom Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

          {/* Team Efficiency */}
          <div className="card-lg" style={{ padding: "20px 22px" }}>
            <SectionHeader title="Team Efficiency" />

            {/* Top performers */}
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>
              Top Performers
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {topPerformers.map((p, i) => (
                <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: rankColors[i],
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 800, color: "#fff", flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name.split(" ")[0]}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 1 }}>{p.actual}h actual</div>
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#059669" }}>{p.rate}%</span>
                </div>
              ))}
            </div>

            {lowPerformers.length > 0 && (
              <>
                <div style={{ height: 1, background: "var(--border)", margin: "0 0 14px" }} />
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>
                  Needs Attention
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {lowPerformers.map((p) => (
                    <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Clock size={13} style={{ color: "#EF4444", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name.split(" ")[0]}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 1 }}>{p.actual}h actual</div>
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#DC2626" }}>{p.rate}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Upcoming Deadlines */}
          <div className="card-lg" style={{ padding: "20px 22px" }}>
            <SectionHeader
              title="Upcoming Deadlines"
              action={
                <Link href="/projects" style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 12, color: "var(--accent)", fontWeight: 600,
                  textDecoration: "none",
                }}>
                  View all <ArrowRight size={11} />
                </Link>
              }
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {deadlines.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>No upcoming deadlines.</p>
              ) : deadlines.map((d) => {
                const overdue = isOverdue(d.due_date);
                return (
                  <Link
                    key={d.id}
                    href={`/projects/${d.id}`}
                    style={{
                      display: "block",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      textDecoration: "none",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#C7D2FE";
                      (e.currentTarget as HTMLElement).style.background = "#F8F9FF";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {d.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 2 }}>
                          {(d.client as { name: string })?.name ?? "—"}
                        </div>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                    <div style={{
                      fontSize: 11.5, fontWeight: 600, marginTop: 6,
                      color: overdue ? "#DC2626" : "#D97706",
                    }}>
                      {overdue ? "⚠ Overdue · " : "Due "}{formatDate(d.due_date)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card-lg" style={{ padding: "20px 22px" }}>
            <SectionHeader
              title="Recent Activity"
              action={<Clock size={13} style={{ color: "var(--text-tertiary)" }} />}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                const dotColor = colorMap[log.action as string] ?? "#9CA3AF";
                return (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{
                      marginTop: 5,
                      width: 7, height: 7,
                      borderRadius: "50%",
                      background: dotColor,
                      flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ fontSize: 12.5, color: "var(--text-primary)", lineHeight: 1.5 }}>
                        {log.description as string}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
                        {timeAgo(log.created_at as string)}
                      </div>
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
