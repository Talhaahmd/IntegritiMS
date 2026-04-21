"use client";
import { use, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { StatusBadge, PriorityBadge, HealthBadge } from "@/components/ui/StatusBadge";
import ProgressBar from "@/components/ui/ProgressBar";
import { useProject, useProjectTasks } from "@/lib/hooks/useProjects";
import { formatDate, formatHours, timeAgo } from "@/lib/utils";
import {
  ArrowLeft, Building2, Calendar, CheckSquare, Clock, AlertCircle,
  Users, TrendingUp, Activity
} from "lucide-react";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: project, loading } = useProject(id);
  const { data: tasks } = useProjectTasks(id);
  const [tab, setTab] = useState<"tasks" | "summary">("tasks");

  if (loading || !project) return (
    <>
      <TopBar title="Project" />
      <PageLoader />
    </>
  );

  const client = project.client as { name: string; company_name: string; email: string; contact_person: string } | undefined;
  const completedTasks = tasks.filter((t) => (t as Record<string, unknown>).status === "completed").length;
  const delayedTasks = tasks.filter((t) => (t as Record<string, unknown>).overdue === true).length;
  const varHours = project.actual_hours - project.estimated_hours;

  return (
    <>
      <TopBar title={project.name} subtitle={client?.name ?? ""} />
      <div className="p-8 animate-fade-in">
        <Link href="/projects" className="btn btn-ghost btn-sm mb-6 -ml-2">
          <ArrowLeft size={14} /> Back to Projects
        </Link>

        {/* Header */}
        <div className="card-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[22px] font-semibold tracking-tight text-gray-900">{project.name}</h2>
              {project.description && (
                <p className="text-[13.5px] mt-1" style={{ color: "var(--text-secondary)" }}>{project.description}</p>
              )}
              <div className="flex items-center gap-3 mt-3">
                <StatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
                <HealthBadge health={project.health_status} />
                {project.category && (
                  <span className="chip bg-slate-100 text-slate-600">{project.category}</span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-4xl font-bold" style={{ color: "var(--accent)" }}>{project.progress_percent}%</div>
              <div className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>Complete</div>
              <div className="w-32 mt-2">
                <ProgressBar value={project.progress_percent} size="md" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-6 mt-6 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
            <div>
              <div className="text-[11px] mb-1" style={{ color: "var(--text-tertiary)" }}>Client</div>
              <Link href={`/clients/${(project.client as { id: string })?.id}`} className="text-[13.5px] font-medium text-indigo-600 hover:underline flex items-center gap-1">
                <Building2 size={12} />{client?.name}
              </Link>
            </div>
            <div>
              <div className="text-[11px] mb-1" style={{ color: "var(--text-tertiary)" }}>Start Date</div>
              <div className="text-[13.5px] font-medium flex items-center gap-1.5">
                <Calendar size={12} style={{ color: "var(--text-tertiary)" }} />
                {project.start_date ? formatDate(project.start_date) : "—"}
              </div>
            </div>
            <div>
              <div className="text-[11px] mb-1" style={{ color: "var(--text-tertiary)" }}>Due Date</div>
              <div className="text-[13.5px] font-medium flex items-center gap-1.5">
                <Clock size={12} style={{ color: "var(--text-tertiary)" }} />
                {project.due_date ? formatDate(project.due_date) : "—"}
              </div>
            </div>
            <div>
              <div className="text-[11px] mb-1" style={{ color: "var(--text-tertiary)" }}>Estimated</div>
              <div className="text-[13.5px] font-medium">{formatHours(project.estimated_hours)}</div>
            </div>
            <div>
              <div className="text-[11px] mb-1" style={{ color: "var(--text-tertiary)" }}>Actual / Variance</div>
              <div className="text-[13.5px] font-medium">
                {formatHours(project.actual_hours)}
                <span className={`ml-2 text-[12px] ${varHours > 0 ? "text-red-500" : "text-emerald-600"}`}>
                  {varHours > 0 ? `+${varHours}h` : `${varHours}h`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Tasks", value: tasks.length, icon: CheckSquare, color: "#6366F1", bg: "#EEF2FF" },
            { label: "Completed", value: completedTasks, icon: Activity, color: "#10B981", bg: "#ECFDF5" },
            { label: "Delayed / Overdue", value: delayedTasks, icon: AlertCircle, color: "#EF4444", bg: "#FEF2F2" },
            { label: "Team Members", value: new Set(tasks.flatMap((t) => ((t as Record<string, unknown>).task_assignments as { team_member_id: string }[] ?? []).map((a) => a.team_member_id))).size, icon: Users, color: "#8B5CF6", bg: "#F5F3FF" },
          ].map((s) => (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-[22px] font-semibold tracking-tight" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[12px] text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tasks Table */}
        <div className="card-lg overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <div className="font-semibold text-[14px]">Tasks ({tasks.length})</div>
          </div>
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-[13px]" style={{ color: "var(--text-tertiary)" }}>No tasks yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignees</th>
                  <th>Est. Hours</th>
                  <th>Due</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {(tasks as Record<string, unknown>[]).map((task) => {
                  const assignees = (task.task_assignments as { team_members: { full_name: string } }[] ?? []);
                  return (
                    <tr key={task.id as string}>
                      <td>
                        <Link href={`/tasks/${task.id}`} className="hover:underline">
                          <div className="font-medium text-[13.5px]">{task.name as string}</div>
                          {task.description ? <div className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{String(task.description).slice(0, 60)}…</div> : null}
                        </Link>
                      </td>
                      <td><span className="chip bg-slate-100 text-slate-600 capitalize">{task.category as string}</span></td>
                      <td><StatusBadge status={task.status as string} /></td>
                      <td><PriorityBadge priority={task.priority as string} /></td>
                      <td>
                        <div className="flex items-center gap-1">
                          {assignees.slice(0, 3).map((a, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                              {a.team_members?.full_name?.charAt(0) ?? "?"}
                            </div>
                          ))}
                          {assignees.length > 3 && <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>+{assignees.length - 3}</span>}
                        </div>
                      </td>
                      <td className="text-[13px]">{formatHours(task.estimated_hours as number)}</td>
                      <td className="text-[12.5px]">{task.expected_end ? formatDate(task.expected_end as string) : "—"}</td>
                      <td className="text-[12.5px]" style={{ color: "var(--text-tertiary)" }}>{timeAgo(task.updated_at as string)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {project.notes && (
          <div className="card-lg p-5 mt-4">
            <div className="section-title mb-2">Project Notes</div>
            <p className="text-[13.5px]" style={{ color: "var(--text-secondary)" }}>{project.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}
