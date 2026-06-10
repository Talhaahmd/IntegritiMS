"use client";
import { use, useState, useMemo } from "react";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { useTeamMember, useMemberTasks } from "@/lib/hooks/useTeam";
import { formatDate, formatHours } from "@/lib/utils";
import {
  ArrowLeft, Mail, Phone, Calendar, Clock, CheckSquare,
  Briefcase, Star, TrendingUp, Activity, RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type Period = "day" | "week" | "month" | "all";

function getDateRange(period: Period): { start: Date; end: Date } | null {
  const now = new Date();
  if (period === "day") {
    const s = new Date(now); s.setHours(0, 0, 0, 0);
    const e = new Date(now); e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }
  if (period === "week") {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const s = new Date(now); s.setDate(now.getDate() + diff); s.setHours(0, 0, 0, 0);
    const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }
  if (period === "month") {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start: s, end: e };
  }
  return null;
}

function filterByPeriod(assignments: Record<string, unknown>[], period: Period) {
  const range = getDateRange(period);
  if (!range) return assignments;
  return assignments.filter((a) => {
    const task = a.tasks as Record<string, unknown> | undefined;
    const ts = task?.expected_start ? new Date(task.expected_start as string) : null;
    const te = task?.expected_end ? new Date(task.expected_end as string) : null;
    if (!ts && !te) return true;
    if (ts && ts >= range.start && ts <= range.end) return true;
    if (te && te >= range.start && te <= range.end) return true;
    if (ts && te && ts <= range.start && te >= range.end) return true;
    return false;
  });
}

const MAX_WEEKLY_HOURS = 40;
const PERIOD_LABELS: Record<Period, string> = { day: "Today", week: "This Week", month: "This Month", all: "All Time" };

export default function TeamMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: member, loading } = useTeamMember(id);
  const { data: assignments, reload } = useMemberTasks(id);
  const [period, setPeriod] = useState<Period>("week");

  const filtered = useMemo(() => filterByPeriod(assignments, period), [assignments, period]);

  const weekAssignments = useMemo(() => filterByPeriod(assignments, "week"), [assignments]);

  const hoursThisWeek = weekAssignments.reduce((s, a) => {
    const task = a.tasks as Record<string, unknown> | undefined;
    return s + ((task?.actual_hours as number) ?? 0);
  }, 0);

  const completedTasks = filtered.filter((a) => {
    const task = a.tasks as Record<string, unknown> | undefined;
    return (task?.status as string) === "completed";
  });

  const activeTasks = filtered.filter((a) => {
    const task = a.tasks as Record<string, unknown> | undefined;
    return !["completed", "cancelled"].includes((task?.status as string) ?? "");
  });

  const totalEst = filtered.reduce((s, a) => {
    const task = a.tasks as Record<string, unknown> | undefined;
    return s + ((task?.estimated_hours as number) ?? 0);
  }, 0);

  const totalAct = filtered.reduce((s, a) => {
    const task = a.tasks as Record<string, unknown> | undefined;
    return s + ((task?.actual_hours as number) ?? 0);
  }, 0);

  const onTimeCount = completedTasks.filter((a) => {
    const task = a.tasks as Record<string, unknown> | undefined;
    return ((task?.actual_hours as number) ?? 0) <= ((task?.estimated_hours as number) ?? 0) * 1.1;
  }).length;
  const onTimeRate = completedTasks.length > 0 ? Math.round((onTimeCount / completedTasks.length) * 100) : 0;

  const perfData = [
    { label: "Est.", value: Math.round(totalEst * 10) / 10 },
    { label: "Actual", value: Math.round(totalAct * 10) / 10 },
  ];

  const weekPct = Math.min(100, Math.round((hoursThisWeek / MAX_WEEKLY_HOURS) * 100));
  const weekColor = weekPct >= 90 ? "#DC2626" : weekPct >= 70 ? "#D97706" : "#4F46E5";

  if (loading || !member) return <><TopBar title="Team Member" /><PageLoader /></>;

  return (
    <>
      <TopBar title={member.full_name} subtitle={member.title} />

      <div style={{ padding: "24px 28px 40px" }} className="animate-fade-in">

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <Link href="/team" className="btn btn-ghost btn-sm" style={{ marginLeft: -4, display: "inline-flex" }}>
            <ArrowLeft size={13} /> Back to Team
          </Link>
          <button
            onClick={reload}
            style={{ height: 32, padding: "0 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: "var(--text-secondary)" }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* ══ Header Card ══ */}
        <div className="card-lg" style={{ padding: "24px 26px", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, flexShrink: 0,
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(99,102,241,0.28)",
              color: "#fff", fontSize: 24, fontWeight: 800,
            }}>
              {member.full_name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px", lineHeight: 1.2 }}>{member.full_name}</h2>
              <div style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 4 }}>{member.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "var(--accent-light)", color: "var(--accent)" }}>{member.primary_skill}</span>
                <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "var(--surface-2)", color: "var(--text-tertiary)", border: "1px solid var(--border)" }}>{member.experience_level.toUpperCase()}</span>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                  background: member.availability_status === "available" ? "#ECFDF5" : member.availability_status === "fully booked" ? "#FEF2F2" : "#FFFBEB",
                  color: member.availability_status === "available" ? "#059669" : member.availability_status === "fully booked" ? "#DC2626" : "#D97706",
                  border: `1px solid ${member.availability_status === "available" ? "#A7F3D0" : member.availability_status === "fully booked" ? "#FCA5A5" : "#FDE68A"}`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
                  {member.availability_status}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, marginTop: 22, paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
            {[
              { label: "Email", icon: Mail, value: member.email },
              { label: "Phone", icon: Phone, value: member.phone ?? "—" },
              { label: "Joined", icon: Calendar, value: member.joining_date ? formatDate(member.joining_date) : "—" },
              { label: "Hourly Rate", icon: Briefcase, value: member.hourly_rate ? `$${member.hourly_rate}/hr` : "—" },
            ].map(({ label, icon: Icon, value }, i) => (
              <div key={label} style={{ paddingLeft: i === 0 ? 0 : 20, borderLeft: i === 0 ? "none" : "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                  <Icon size={12} style={{ color: "var(--text-tertiary)" }} />
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ Hours/Week Banner ══ */}
        <div className="card-lg" style={{ padding: "18px 22px", marginBottom: 18, background: weekPct >= 90 ? "#FEF2F2" : "var(--surface)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Hours This Week</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>Actual hours logged · Max {MAX_WEEKLY_HOURS}h/week</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: weekColor, letterSpacing: "-1px", lineHeight: 1 }}>
                {Math.round(hoursThisWeek * 10) / 10}<span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-tertiary)", marginLeft: 2 }}>h</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{weekPct}% of {MAX_WEEKLY_HOURS}h cap</div>
            </div>
          </div>
          <div style={{ height: 10, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: `${weekPct}%`,
              background: weekColor,
              transition: "width 0.5s ease",
            }} />
          </div>
          {weekPct >= 90 && (
            <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 600, color: "#DC2626" }}>
              ⚠ Approaching weekly capacity
            </div>
          )}
        </div>

        {/* ══ Period Filter + Stats ══ */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
            Performance — <span style={{ color: "var(--accent)" }}>{PERIOD_LABELS[period]}</span>
          </div>
          <div style={{ display: "flex", gap: 4, background: "var(--surface-2)", padding: 3, borderRadius: 10, border: "1px solid var(--border)" }}>
            {(["day", "week", "month", "all"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  height: 28, padding: "0 12px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: 600,
                  background: period === p ? "var(--accent)" : "transparent",
                  color: period === p ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* ══ Stats Row ══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 18 }}>
          {[
            { label: "Active Tasks", value: activeTasks.length, color: "#4F46E5", bg: "#EEF2FF", icon: Clock },
            { label: "Completed", value: completedTasks.length, color: "#059669", bg: "#ECFDF5", icon: CheckSquare },
            { label: "Efficiency", value: `${onTimeRate}%`, color: onTimeRate >= 80 ? "#059669" : "#D97706", bg: "#FFFBEB", icon: TrendingUp },
            { label: "Est. Hours", value: formatHours(totalEst), color: "#4F46E5", bg: "#EEF2FF", icon: Star },
            { label: "Actual Hours", value: formatHours(totalAct), color: totalAct > totalEst ? "#DC2626" : "#059669", bg: totalAct > totalEst ? "#FEF2F2" : "#ECFDF5", icon: Activity },
          ].map((s) => (
            <div key={s.label} className="card" style={{ padding: "16px 18px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <s.icon size={15} style={{ color: s.color }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: "-0.5px", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 5, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ══ Chart + Skills ══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14, marginBottom: 18 }}>
          <div className="card-lg" style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Hours Overview</div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 14 }}>{PERIOD_LABELS[period]}</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={perfData} margin={{ left: -30, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "var(--surface-2)" }} formatter={(v) => [`${v}h`, ""]} />
                <Bar dataKey="value" fill="var(--accent)" radius={[5, 5, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card-lg" style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 18 }}>Expertise & Professional Skills</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {(member.expertise ?? []).map((ex) => (
                <span key={ex} style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>{ex}</span>
              ))}
              {(!member.expertise || member.expertise.length === 0) && (
                <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>No expertise listed.</div>
              )}
            </div>
            {member.notes && (
              <div style={{ paddingTop: 18, borderTop: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 8 }}>Internal Notes</div>
                <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>{member.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* ══ Tasks Table ══ */}
        <div className="card-lg" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Assigned Tasks</div>
            <span style={{ padding: "1px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-tertiary)" }}>
              {filtered.length}{period !== "all" ? ` of ${assignments.length}` : ""}
            </span>
            {period !== "all" && (
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginLeft: 4 }}>— {PERIOD_LABELS[period]}</span>
            )}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: "40px 22px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
              No tasks found for {PERIOD_LABELS[period].toLowerCase()}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ minWidth: 900 }}>
                <colgroup>
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "7%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Est. Hrs</th>
                    <th>Actual Hrs</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {(filtered as Record<string, unknown>[]).map((a) => {
                    const task = a.tasks as Record<string, unknown> | undefined;
                    const project = task?.projects as Record<string, unknown> | undefined;
                    const estHrs = (task?.estimated_hours as number) ?? 0;
                    const actHrs = (task?.actual_hours as number) ?? 0;
                    const over = actHrs > estHrs * 1.1 && estHrs > 0;
                    return (
                      <tr key={a.id as string}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)" }}>{task?.name as string ?? "—"}</div>
                        </td>
                        <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{project?.name as string ?? "—"}</td>
                        <td>
                          <span style={{ padding: "2px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: "var(--surface-2)", color: "var(--text-tertiary)", textTransform: "capitalize" }}>
                            {task?.category as string ?? "—"}
                          </span>
                        </td>
                        <td><StatusBadge status={task?.status as string ?? "not started"} /></td>
                        <td><PriorityBadge priority={task?.priority as string ?? "medium"} /></td>
                        <td style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{estHrs}h</td>
                        <td style={{ fontSize: 13, fontWeight: 600, color: over ? "#DC2626" : "#059669" }}>{actHrs}h</td>
                        <td style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{task?.expected_end ? formatDate(task.expected_end as string) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: "var(--surface-2)", fontWeight: 700 }}>
                    <td colSpan={5} style={{ padding: "10px 12px", fontSize: 12, color: "var(--text-tertiary)", textAlign: "right" }}>Totals</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: "var(--text-primary)" }}>{Math.round(totalEst * 10) / 10}h</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: totalAct > totalEst ? "#DC2626" : "#059669" }}>{Math.round(totalAct * 10) / 10}h</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
