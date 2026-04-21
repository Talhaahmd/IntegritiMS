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
  Users, Activity,
} from "lucide-react";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: project, loading } = useProject(id);
  const { data: tasks } = useProjectTasks(id);

  if (loading || !project) return (
    <>
      <TopBar title="Project" />
      <PageLoader />
    </>
  );

  const client = project.client as { id: string; name: string; company_name: string } | undefined;
  const completedTasks = tasks.filter((t) => (t as Record<string, unknown>).status === "completed").length;
  const delayedTasks   = tasks.filter((t) => (t as Record<string, unknown>).overdue === true).length;
  const teamSize = new Set(
    tasks.flatMap((t) =>
      ((t as Record<string, unknown>).task_assignments as { team_member_id: string }[] ?? []).map((a) => a.team_member_id)
    )
  ).size;
  const varHours = project.actual_hours - project.estimated_hours;

  /* ── avatar seed ── */
  const avatarBg = "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)";

  return (
    <>
      <TopBar title={project.name} subtitle={client?.name ?? ""} />

      <div style={{ padding: "24px 28px 40px" }} className="animate-fade-in">

        {/* Back link */}
        <Link
          href="/projects"
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: 20, marginLeft: -4, display: "inline-flex" }}
        >
          <ArrowLeft size={13} /> Back to Projects
        </Link>

        {/* ══════════ Header Card ══════════ */}
        <div className="card-lg" style={{ padding: "24px 26px", marginBottom: 18 }}>

          {/* Top section: icon + name + progress ring */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>

            {/* Left: icon + name + description + badges */}
            <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
              {/* Folder icon avatar */}
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: avatarBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 14px rgba(99,102,241,0.28)",
              }}>
                <Building2 size={22} color="#fff" strokeWidth={1.8} />
              </div>

              <div style={{ minWidth: 0 }}>
                <h2 style={{
                  fontSize: 22, fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.5px", lineHeight: 1.2,
                }}>
                  {project.name}
                </h2>

                {project.description && (
                  <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 5, lineHeight: 1.5 }}>
                    {project.description}
                  </p>
                )}

                {/* Badges */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <StatusBadge status={project.status} />
                  <PriorityBadge priority={project.priority} />
                  <HealthBadge health={project.health_status} />
                  {project.category && (
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      padding: "2px 10px", borderRadius: 999,
                      fontSize: 12, fontWeight: 500,
                      background: "#F1F5F9", color: "#475569",
                    }}>
                      {project.category}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: large progress display */}
            <div style={{
              flexShrink: 0, textAlign: "right",
              padding: "4px 0",
            }}>
              <div style={{
                fontSize: 42, fontWeight: 800,
                color: "var(--accent)", lineHeight: 1,
                letterSpacing: "-2px",
              }}>
                {project.progress_percent}
                <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-1px" }}>%</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4, fontWeight: 500 }}>
                Complete
              </div>
              <div style={{ width: 120, marginTop: 8, marginLeft: "auto" }}>
                <ProgressBar value={project.progress_percent} size="md" />
              </div>
            </div>
          </div>

          {/* ── Info strip ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 0,
            marginTop: 22,
            paddingTop: 20,
            borderTop: "1px solid var(--border-subtle)",
          }}>
            {[
              {
                label: "Client",
                content: (
                  <Link
                    href={`/clients/${client?.id}`}
                    style={{
                      fontSize: 13, fontWeight: 600,
                      color: "var(--accent)",
                      textDecoration: "none",
                      display: "flex", alignItems: "center", gap: 4,
                    }}
                  >
                    <Building2 size={12} /> {client?.name ?? "—"}
                  </Link>
                ),
              },
              {
                label: "Start Date",
                content: (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    <Calendar size={12} style={{ color: "var(--text-tertiary)" }} />
                    {project.start_date ? formatDate(project.start_date) : "—"}
                  </div>
                ),
              },
              {
                label: "Due Date",
                content: (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    <Clock size={12} style={{ color: "var(--text-tertiary)" }} />
                    {project.due_date ? formatDate(project.due_date) : "—"}
                  </div>
                ),
              },
              {
                label: "Estimated",
                content: (
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    {formatHours(project.estimated_hours)}
                  </div>
                ),
              },
              {
                label: "Actual / Variance",
                content: (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    {formatHours(project.actual_hours)}
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: varHours > 0 ? "#DC2626" : "#059669",
                      background: varHours > 0 ? "#FEF2F2" : "#ECFDF5",
                      padding: "1px 7px", borderRadius: 999,
                    }}>
                      {varHours > 0 ? `+${varHours}h` : `${varHours}h`}
                    </span>
                  </div>
                ),
              },
            ].map(({ label, content }, i) => (
              <div
                key={label}
                style={{
                  paddingLeft: i === 0 ? 0 : 20,
                  borderLeft: i === 0 ? "none" : "1px solid var(--border-subtle)",
                }}
              >
                <div style={{
                  fontSize: 11, color: "var(--text-tertiary)",
                  fontWeight: 600, letterSpacing: "0.04em",
                  textTransform: "uppercase", marginBottom: 6,
                }}>
                  {label}
                </div>
                {content}
              </div>
            ))}
          </div>
        </div>

        {/* ══════════ Stat Row ══════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
          {[
            { label: "Total Tasks",       value: tasks.length,  icon: CheckSquare, color: "#4F46E5", bg: "#EEF2FF" },
            { label: "Completed",         value: completedTasks, icon: Activity,   color: "#059669", bg: "#ECFDF5" },
            { label: "Delayed / Overdue", value: delayedTasks,  icon: AlertCircle, color: "#DC2626", bg: "#FEF2F2" },
            { label: "Team Members",      value: teamSize,       icon: Users,      color: "#7C3AED", bg: "#F5F3FF" },
          ].map((s) => (
            <div
              key={s.label}
              className="card"
              style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: s.bg, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <s.icon size={17} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: s.color, letterSpacing: "-0.5px" }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, fontWeight: 500 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ══════════ Tasks Table Card ══════════ */}
        <div className="card-lg" style={{ overflow: "hidden" }}>
          {/* Card header */}
          <div style={{
            padding: "16px 22px",
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.2px" }}>
              Tasks
              <span style={{
                marginLeft: 8, fontSize: 12, fontWeight: 600,
                color: "var(--text-tertiary)",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                padding: "1px 8px", borderRadius: 999,
              }}>
                {tasks.length}
              </span>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", fontSize: 13, color: "var(--text-tertiary)" }}>
              No tasks yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ minWidth: 820 }}>
                <colgroup>
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
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
                        {/* Task name */}
                        <td>
                          <Link href={`/tasks/${task.id}`} style={{ textDecoration: "none", display: "block" }}>
                            <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.3 }}>
                              {task.name as string}
                            </div>
                            {task.description ? (
                              <div style={{ fontSize: 11.5, marginTop: 3, color: "var(--text-tertiary)", lineHeight: 1.4 }}>
                                {String(task.description).slice(0, 60)}…
                              </div>
                            ) : null}
                          </Link>
                        </td>

                        {/* Category chip */}
                        <td>
                          <span style={{
                            display: "inline-flex", alignItems: "center",
                            padding: "2px 10px", borderRadius: 999,
                            fontSize: 11.5, fontWeight: 500,
                            background: "#F1F5F9", color: "#475569",
                            textTransform: "capitalize",
                          }}>
                            {task.category as string}
                          </span>
                        </td>

                        {/* Status */}
                        <td><StatusBadge status={task.status as string} /></td>

                        {/* Priority */}
                        <td><PriorityBadge priority={task.priority as string} /></td>

                        {/* Assignee avatars */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            {assignees.slice(0, 3).map((a, i) => (
                              <div
                                key={i}
                                title={a.team_members?.full_name}
                                style={{
                                  width: 26, height: 26, borderRadius: "50%",
                                  background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
                                  color: "#fff", fontSize: 10, fontWeight: 700,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  boxShadow: "0 0 0 2px #fff",
                                }}
                              >
                                {a.team_members?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                              </div>
                            ))}
                            {assignees.length > 3 && (
                              <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginLeft: 2 }}>
                                +{assignees.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Est. hours */}
                        <td style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                          {formatHours(task.estimated_hours as number)}
                        </td>

                        {/* Due */}
                        <td style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)" }}>
                          {task.expected_end ? formatDate(task.expected_end as string) : "—"}
                        </td>

                        {/* Updated */}
                        <td style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 400 }}>
                          {timeAgo(task.updated_at as string)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Project Notes ── */}
        {project.notes && (
          <div
            className="card-lg"
            style={{ padding: "18px 22px", marginTop: 14, background: "#FFFBEB", border: "1px solid #FEF3C7" }}
          >
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
              textTransform: "uppercase", color: "#B45309", marginBottom: 8,
            }}>
              Project Notes
            </div>
            <p style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.6 }}>{project.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}
