"use client";
import { use } from "react";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import ProgressBar from "@/components/ui/ProgressBar";
import Avatar from "@/components/ui/Avatar";
import { useTeamMember, useMemberTasks } from "@/lib/hooks/useTeam";
import { formatDate, formatHours } from "@/lib/utils";
import { ArrowLeft, Mail, Phone, Calendar, Clock, CheckSquare, Briefcase, Star, TrendingUp, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function TeamMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: member, loading } = useTeamMember(id);
  const { data: assignments } = useMemberTasks(id);

  if (loading || !member) return (
    <>
      <TopBar title="Team Member" />
      <PageLoader />
    </>
  );

  const completedAssignments = assignments.filter((a) => (a as Record<string, unknown>).status === "completed");
  const activeAssignments = assignments.filter((a) => !["completed", "cancelled"].includes((a as Record<string, unknown>).status as string));
  const totalEst = assignments.reduce((s, a) => s + ((a as Record<string, unknown>).estimated_hours as number ?? 0), 0);
  const totalAct = assignments.reduce((s, a) => s + ((a as Record<string, unknown>).actual_hours as number ?? 0), 0);
  const onTimeCount = completedAssignments.filter((a) => {
    const r = a as Record<string, unknown>;
    return (r.actual_hours as number) <= (r.estimated_hours as number) * 1.1;
  }).length;
  const onTimeRate = completedAssignments.length > 0 ? Math.round((onTimeCount / completedAssignments.length) * 100) : 0;

  const perfData = [
    { label: "Expected", value: totalEst },
    { label: "Actual", value: totalAct },
  ];

  const avatarBg = "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)";

  return (
    <>
      <TopBar title={member.full_name} subtitle={member.title} />

      <div style={{ padding: "24px 28px 40px" }} className="animate-fade-in">
        
        {/* Back Link */}
        <Link href="/team" className="btn btn-ghost btn-sm" style={{ marginBottom: 20, marginLeft: -4, display: "inline-flex" }}>
          <ArrowLeft size={13} /> Back to Team
        </Link>

        {/* ══════════ Header Card ══════════ */}
        <div className="card-lg" style={{ padding: "24px 26px", marginBottom: 18 }}>
          
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: avatarBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 14px rgba(99,102,241,0.28)",
              color: "#fff", fontSize: 24, fontWeight: 800
            }}>
              {member.full_name.charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                {member.full_name}
              </h2>
              <div style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 4 }}>{member.title}</div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "var(--accent-light)", color: "var(--accent)" }}>
                  {member.primary_skill}
                </span>
                <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "var(--surface-2)", color: "var(--text-tertiary)", border: "1px solid var(--border)" }}>
                  {member.experience_level.toUpperCase()}
                </span>
                <span style={{ 
                  display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                  background: member.availability_status === "available" ? "#ECFDF5" : member.availability_status === "fully booked" ? "#FEF2F2" : "#FFFBEB",
                  color: member.availability_status === "available" ? "#059669" : member.availability_status === "fully booked" ? "#DC2626" : "#D97706",
                  border: `1px solid ${member.availability_status === "available" ? "#A7F3D0" : member.availability_status === "fully booked" ? "#FCA5A5" : "#FDE68A"}`
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
                  {member.availability_status}
                </span>
              </div>
            </div>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, marginTop: 22, paddingTop: 20, borderTop: "1px solid var(--border-subtle)"
          }}>
            {[
              { label: "Email", icon: Mail, value: member.email },
              { label: "Phone", icon: Phone, value: member.phone ?? "—" },
              { label: "Joined Date", icon: Calendar, value: member.joining_date ? formatDate(member.joining_date) : "—" },
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

        {/* ══════════ Stats Row ══════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 18 }}>
          {[
            { label: "Active Tasks", value: activeAssignments.length, color: "#4F46E5", bg: "#EEF2FF", icon: Clock },
            { label: "Completed", value: completedAssignments.length, color: "#059669", bg: "#ECFDF5", icon: CheckSquare },
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14, marginBottom: 18 }}>
          
          {/* Hours Overview Chart */}
          <div className="card-lg" style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 18 }}>Hours Overview</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={perfData} margin={{ left: -30, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "var(--surface-2)" }} />
                <Bar dataKey="value" fill="var(--accent)" radius={[5, 5, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Skills & Expertise */}
          <div className="card-lg" style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 18 }}>Expertise & Professional Skills</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {(member.expertise ?? []).map((ex) => (
                <span key={ex} style={{ 
                  padding: "4px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, 
                  background: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)" 
                }}>
                  {ex}
                </span>
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

        {/* Assigned Tasks Table */}
        <div className="card-lg" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Assigned Tasks</div>
            <span style={{ padding: "1px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-tertiary)" }}>
              {assignments.length}
            </span>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: 900 }}>
              <colgroup>
                <col style={{ width: "25%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "11%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Est. Hours</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {(assignments as Record<string, unknown>[]).map((a) => {
                  const task = a.tasks as Record<string, unknown> | undefined;
                  const project = task?.projects as Record<string, unknown> | undefined;
                  return (
                    <tr key={a.id as string}>
                      <td>
                        <Link href={`/tasks/${task?.id}`} style={{ textDecoration: "none" }}>
                          <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)" }}>{task?.name as string ?? "—"}</div>
                        </Link>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{project?.name as string ?? "—"}</td>
                      <td>
                        <span style={{ padding: "2px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: "var(--surface-2)", color: "var(--text-tertiary)", textTransform: "capitalize" }}>
                          {task?.category as string ?? "—"}
                        </span>
                      </td>
                      <td><StatusBadge status={a.status as string} /></td>
                      <td><PriorityBadge priority={task?.priority as string ?? "medium"} /></td>
                      <td style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{formatHours(a.estimated_hours as number)}</td>
                      <td style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)" }}>{task?.expected_end ? formatDate(task.expected_end as string) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
