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
import { ArrowLeft, Mail, Phone, Calendar, Clock, CheckSquare, AlertCircle, Briefcase, Star } from "lucide-react";
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

  return (
    <>
      <TopBar title={member.full_name} subtitle={member.title} />
      <div className="p-8 animate-fade-in">
        <Link href="/team" className="btn btn-ghost btn-sm mb-6 -ml-2">
          <ArrowLeft size={14} /> Back to Team
        </Link>

        {/* Header Card */}
        <div className="card-lg p-6 mb-6">
          <div className="flex items-start gap-6">
            <Avatar name={member.full_name} size="lg" className="w-16 h-16 text-xl" />
            <div className="flex-1">
              <h2 className="text-[22px] font-semibold tracking-tight text-gray-900">{member.full_name}</h2>
              <div className="text-[13.5px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{member.title}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="chip bg-indigo-50 text-indigo-700">{member.primary_skill}</span>
                <span className="chip bg-slate-100 text-slate-600 capitalize">{member.experience_level}</span>
                <span className={`badge capitalize ${member.availability_status === "available" ? "bg-emerald-50 text-emerald-700" : member.availability_status === "fully booked" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                  {member.availability_status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 mt-6 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <Mail size={14} style={{ color: "var(--text-tertiary)" }} />
              <div>
                <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Email</div>
                <div className="text-[13px] font-medium">{member.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} style={{ color: "var(--text-tertiary)" }} />
              <div>
                <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Phone</div>
                <div className="text-[13px] font-medium">{member.phone ?? "—"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} style={{ color: "var(--text-tertiary)" }} />
              <div>
                <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Joined</div>
                <div className="text-[13px] font-medium">{member.joining_date ? formatDate(member.joining_date) : "—"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase size={14} style={{ color: "var(--text-tertiary)" }} />
              <div>
                <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Rate</div>
                <div className="text-[13px] font-medium">{member.hourly_rate ? `$${member.hourly_rate}/hr` : "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[
            { label: "Active Tasks", value: activeAssignments.length, color: "#6366F1", bg: "#EEF2FF" },
            { label: "Completed", value: completedAssignments.length, color: "#10B981", bg: "#ECFDF5" },
            { label: "On-Time Rate", value: `${onTimeRate}%`, color: onTimeRate >= 80 ? "#10B981" : "#F59E0B", bg: "#FFFBEB" },
            { label: "Total Est. Hours", value: formatHours(totalEst), color: "#6366F1", bg: "#EEF2FF" },
            { label: "Total Actual Hours", value: formatHours(totalAct), color: totalAct > totalEst ? "#EF4444" : "#10B981", bg: totalAct > totalEst ? "#FEF2F2" : "#ECFDF5" },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="w-8 h-8 rounded-xl mb-3 flex items-center justify-center" style={{ background: s.bg }}>
                <Star size={13} style={{ color: s.color }} />
              </div>
              <div className="text-[20px] font-semibold tracking-tight" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[12px] mt-0.5 text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Performance Chart */}
          <div className="card-lg p-5 col-span-1">
            <div className="font-semibold text-[14px] mb-4">Hours Overview</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={perfData} margin={{ left: -30, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Expertise */}
          <div className="card-lg p-5 col-span-2">
            <div className="font-semibold text-[14px] mb-4">Expertise & Skills</div>
            <div className="flex flex-wrap gap-2">
              {(member.expertise ?? []).map((ex) => (
                <span key={ex} className="chip bg-indigo-50 text-indigo-700 text-[12px]">{ex}</span>
              ))}
              {(!member.expertise || member.expertise.length === 0) && (
                <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>No expertise listed.</span>
              )}
            </div>
            {member.notes && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="section-title mb-2">Notes</div>
                <p className="text-[13.5px]" style={{ color: "var(--text-secondary)" }}>{member.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="card-lg overflow-hidden">
          <div className="px-6 py-4 border-b font-semibold text-[14px]" style={{ borderColor: "var(--border)" }}>
            Assigned Tasks ({assignments.length})
          </div>
          {assignments.length === 0 ? (
            <div className="p-8 text-center text-[13px]" style={{ color: "var(--text-tertiary)" }}>No tasks assigned.</div>
          ) : (
            <table>
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
                        <Link href={`/tasks/${task?.id}`} className="font-medium text-[13.5px] hover:underline">
                          {task?.name as string ?? "—"}
                        </Link>
                      </td>
                      <td className="text-[13px]">{project?.name as string ?? "—"}</td>
                      <td><span className="chip bg-slate-100 text-slate-600 capitalize text-[11.5px]">{task?.category as string ?? "—"}</span></td>
                      <td><StatusBadge status={a.status as string} /></td>
                      <td><PriorityBadge priority={task?.priority as string ?? "medium"} /></td>
                      <td className="text-[13px]">{formatHours(a.estimated_hours as number)}</td>
                      <td className="text-[12.5px]">{task?.expected_end ? formatDate(task.expected_end as string) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
