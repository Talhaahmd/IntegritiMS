"use client";
import { use, useState, useRef, useEffect } from "react";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { StatusBadge, PriorityBadge, HealthBadge } from "@/components/ui/StatusBadge";
import ProgressBar from "@/components/ui/ProgressBar";
import Modal from "@/components/ui/Modal";
import { useProject, useProjectTasks, updateProjectRecord } from "@/lib/hooks/useProjects";
import { createTaskRecord, useTasks } from "@/lib/hooks/useTasks";
import { useClients } from "@/lib/hooks/useClients";
import { useTeamMembers } from "@/lib/hooks/useTeam";
import { useMilestones, createMilestoneRecord, updateMilestoneRecord, deleteMilestoneRecord } from "@/lib/hooks/useMilestones";
import { formatDate, formatHours, timeAgo } from "@/lib/utils";
import { createClient as createSBClient } from "@/lib/supabase/client";
import {
  ArrowLeft, Building2, Calendar, CheckSquare, Clock, AlertCircle,
  Users, Activity, Edit3, Save, X, Plus, Settings, ChevronDown,
  Flag, Trash2, DollarSign, Check, Search,
} from "lucide-react";
import { TASK_CATEGORIES, TASK_STATUSES, TaskCategory, Milestone, MilestoneStatus } from "@/types";

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "var(--text-secondary)", marginBottom: 5,
};

/* ── Inline editable field ── */
function EditableField({ value, onSave, type = "text", placeholder }: { value: string | number | null; onSave: (v: string) => Promise<void>; type?: string; placeholder?: string }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState("");

  function start() { setLocal(String(value ?? "")); setEditing(true); }
  async function commit() { setEditing(false); if (local !== String(value ?? "")) await onSave(local); }

  if (editing) return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input
        autoFocus type={type} value={local} onChange={e => setLocal(e.target.value)}
        onBlur={commit} onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        style={{ fontSize: 13, fontWeight: 600, border: "1px solid var(--accent)", borderRadius: 6, padding: "3px 8px", outline: "none", background: "var(--surface)" }}
        placeholder={placeholder}
      />
      <button onClick={commit} style={{ background: "none", border: "none", cursor: "pointer", color: "#059669" }}><Save size={13} /></button>
      <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}><X size={13} /></button>
    </div>
  );

  return (
    <div onClick={start} style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }} title="Click to edit">
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{value ?? <span style={{ color: "var(--text-tertiary)", fontStyle: "italic" }}>—</span>}</span>
      <Edit3 size={11} style={{ color: "var(--text-tertiary)", opacity: 0.6 }} />
    </div>
  );
}

function EditableSelect({ value, options, onSave }: { value: string; options: { value: string; label: string }[]; onSave: (v: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  if (!editing) return (
    <div onClick={() => setEditing(true)} style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{options.find(o => o.value === value)?.label ?? value}</span>
      <ChevronDown size={12} style={{ color: "var(--text-tertiary)" }} />
    </div>
  );
  return (
    <select autoFocus className="input-base" style={{ height: 30, fontSize: 12 }} value={value}
      onChange={async e => { await onSave(e.target.value); setEditing(false); }}
      onBlur={() => setEditing(false)}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ── Milestone status badge ─────────────────────────────────────── */
const MS_COLORS: Record<string, { bg: string; color: string }> = {
  active:    { bg: "#EFF6FF", color: "#2563EB" },
  completed: { bg: "#ECFDF5", color: "#059669" },
  on_hold:   { bg: "#FFFBEB", color: "#B45309" },
  blocked:   { bg: "#FEF2F2", color: "#DC2626" },
};
function MilestoneStatusBadge({ status }: { status: string }) {
  const c = MS_COLORS[status] ?? { bg: "#F3F4F6", color: "#374151" };
  return <span style={{ display: "inline-flex", alignItems: "center", background: c.bg, color: c.color, borderRadius: 6, padding: "3px 8px", fontSize: 11.5, fontWeight: 600, textTransform: "capitalize" }}>{status.replace("_", " ")}</span>;
}

/* ── Inline milestone status dropdown ───────────────────────────── */
function MilestoneStatusDropdown({ value, onSave }: { value: MilestoneStatus; onSave: (v: MilestoneStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const statuses: MilestoneStatus[] = ["active","completed","on_hold","blocked"];
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <MilestoneStatusBadge status={value} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.10)", minWidth: 140, padding: 4 }}>
          {statuses.map(s => (
            <button key={s} onClick={() => { onSave(s); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: s === value ? "#F5F3FF" : "none", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
              <MilestoneStatusBadge status={s} />
              {s === value && <Check size={12} style={{ marginLeft: "auto", color: "#4F46E5" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const projectHook = useProject(id);
  const project = projectHook.data;
  const loading = projectHook.loading;
  const reload = projectHook.reload;
  const tasksHook = useProjectTasks(id);
  const tasks = tasksHook.data;         // tasks already linked to this project
  const reloadTasks = tasksHook.reload;
  /* all tasks in the system — used for milestone picker so user can assign any task */
  const allTasksHook = useTasks();
  const allTasks = allTasksHook.data;
  const reloadAllTasks = allTasksHook.reload;
  const { data: clients } = useClients();
  const { data: members } = useTeamMembers();
  const milestonesHook = useMilestones({ projectId: id });
  const milestones = milestonesHook.data;
  const reloadMilestones = milestonesHook.reload;

  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [taskForm, setTaskForm] = useState({ name: "", category: "development" as TaskCategory, priority: "medium", estimated_hours: 0, expected_start: "", expected_end: "", description: "", assignee_id: "", milestone_id: "" });
  const [taskSaving, setTaskSaving] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ name: "", start_date: "", end_date: "", cost: 0, status: "active" as MilestoneStatus, notes: "" });
  const [milestoneSaving, setMilestoneSaving] = useState(false);
  /* track which milestone's task panel is expanded */
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  /* search query per milestone task panel */
  const [msTaskSearch, setMsTaskSearch] = useState<Record<string, string>>({});
  /* track in-flight task assignment saves */
  const [togglingTask, setTogglingTask] = useState<string | null>(null);

  if (loading || !project) return <><TopBar title="Project" /><PageLoader /></>;

  // project is guaranteed non-null past this point
  const p = project!;
  const client = p.client as { id: string; name: string; company_name: string } | undefined;
  const completedTasks = tasks.filter(t => (t as any).status === "completed").length;
  const delayedTasks = tasks.filter(t => (t as any).overdue === true).length;
  const teamSize = new Set(tasks.flatMap(t => ((t as any).task_assignments as { team_member_id: string }[] ?? []).map(a => a.team_member_id))).size;
  const varHours = p.actual_hours - p.estimated_hours;

  function openEdit() {
    setEditForm({
      name: p.name,
      description: p.description ?? "",
      status: p.status,
      priority: p.priority,
      health_status: p.health_status,
      category: p.category ?? "",
      estimated_hours: p.estimated_hours,
      start_date: p.start_date ? p.start_date.slice(0, 10) : "",
      due_date: p.due_date ? p.due_date.slice(0, 10) : "",
      progress_percent: p.progress_percent,
      notes: p.notes ?? "",
    });
    setShowEditModal(true);
  }

  async function saveEdit() {
    setSaving(true);
    await updateProjectRecord(id, {
      ...editForm,
      start_date: editForm.start_date || null,
      due_date: editForm.due_date || null,
      estimated_hours: Number(editForm.estimated_hours),
      progress_percent: Number(editForm.progress_percent),
    });
    setSaving(false);
    setShowEditModal(false);
    reload();
  }

  async function handleQuickSave(field: string, value: any) {
    await updateProjectRecord(id, { [field]: value });
    reload();
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    setTaskSaving(true);
    const { assignee_id, milestone_id, ...rest } = taskForm;
    const { data: newTask } = await createTaskRecord({
      ...rest, project_id: id, client_id: p.client_id,
      milestone_id: milestone_id || null,
      status: "not started" as const, actual_hours: 0,
      priority: rest.priority as any,
      expected_start: rest.expected_start ? new Date(rest.expected_start).toISOString() : null,
      expected_end: rest.expected_end ? new Date(rest.expected_end).toISOString() : null,
      estimated_hours: Number(rest.estimated_hours),
    });
    if (newTask && assignee_id) {
      await createSBClient().from("task_assignments").insert({ task_id: (newTask as any).id, team_member_id: assignee_id, estimated_hours: Number(rest.estimated_hours), actual_hours: 0, status: "not started" });
    }
    setTaskSaving(false);
    setShowTaskModal(false);
    setTaskForm({ name: "", category: "development", priority: "medium", estimated_hours: 0, expected_start: "", expected_end: "", description: "", assignee_id: "", milestone_id: "" });
    reloadTasks();
    reloadMilestones();
  }

  async function handleCreateMilestone(e: React.FormEvent) {
    e.preventDefault();
    setMilestoneSaving(true);
    await createMilestoneRecord({
      ...milestoneForm,
      project_id: id,
      client_id: p.client_id,
      cost: Number(milestoneForm.cost),
      start_date: milestoneForm.start_date || null,
      end_date: milestoneForm.end_date || null,
    });
    setMilestoneSaving(false);
    setShowMilestoneModal(false);
    setMilestoneForm({ name: "", start_date: "", end_date: "", cost: 0, status: "active", notes: "" });
    reloadMilestones();
  }

  /**
   * Check = assign task to this milestone (and this project/client if not already).
   * Uncheck = remove from milestone only; leaves project_id intact.
   * If task belonged to a different milestone it is simply reassigned.
   */
  async function handleTaskMilestoneToggle(taskId: string, milestoneId: string, checked: boolean) {
    setTogglingTask(taskId);
    const update: Record<string, unknown> = { milestone_id: checked ? milestoneId : null };
    if (checked) {
      /* link task to this project + client so it surfaces everywhere */
      update.project_id = id;
      update.client_id = p.client_id || null;
    }
    await createSBClient().from("tasks").update(update).eq("id", taskId);
    await Promise.all([reloadTasks(), reloadAllTasks(), reloadMilestones()]);
    setTogglingTask(null);
  }

  const avatarBg = "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)";

  return (
    <>
      <TopBar title={p.name} subtitle={client?.name ?? ""} />

      <div style={{ padding: "24px 28px 40px" }} className="animate-fade-in">

        <Link href="/projects" className="btn btn-ghost btn-sm" style={{ marginBottom: 20, marginLeft: -4, display: "inline-flex" }}>
          <ArrowLeft size={13} /> Back to Projects
        </Link>

        {/* Header Card */}
        <div className="card-lg" style={{ padding: "24px 26px", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
            <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(99,102,241,0.28)" }}>
                <Building2 size={22} color="#fff" strokeWidth={1.8} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px", lineHeight: 1.2 }}>{p.name}</h2>
                {p.description && <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 5, lineHeight: 1.5 }}>{p.description}</p>}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <StatusBadge status={p.status} />
                  <PriorityBadge priority={p.priority} />
                  <HealthBadge health={p.health_status} />
                  {p.category && <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 500, background: "#F1F5F9", color: "#475569" }}>{p.category}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 42, fontWeight: 800, color: "var(--accent)", lineHeight: 1, letterSpacing: "-2px" }}>
                  {p.progress_percent}<span style={{ fontSize: 22, fontWeight: 600 }}>%</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4, fontWeight: 500 }}>Complete</div>
                <div style={{ width: 120, marginTop: 8, marginLeft: "auto" }}><ProgressBar value={p.progress_percent} size="md" /></div>
              </div>
              <button className="btn btn-secondary" style={{ height: 34, fontSize: 13, gap: 6 }} onClick={openEdit}>
                <Settings size={13} /> Edit Project
              </button>
            </div>
          </div>

          {/* Info strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0, marginTop: 22, paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
            {[
              { label: "Client", content: client ? <Link href={`/clients/${client.id}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}><Building2 size={12} />{client.name}</Link> : "—" },
              { label: "Start Date", content: <EditableField value={p.start_date ? p.start_date.slice(0, 10) : null} type="date" onSave={v => handleQuickSave("start_date", v || null)} placeholder="Pick date" /> },
              { label: "Due Date", content: <EditableField value={p.due_date ? p.due_date.slice(0, 10) : null} type="date" onSave={v => handleQuickSave("due_date", v || null)} placeholder="Pick date" /> },
              { label: "Estimated Hours", content: <EditableField value={p.estimated_hours} type="number" onSave={v => handleQuickSave("estimated_hours", Number(v))} /> },
              { label: "Actual / Variance", content: <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{formatHours(p.actual_hours)}<span style={{ fontSize: 12, fontWeight: 700, color: varHours > 0 ? "#DC2626" : "#059669", background: varHours > 0 ? "#FEF2F2" : "#ECFDF5", padding: "1px 7px", borderRadius: 999 }}>{varHours > 0 ? `+${varHours}h` : `${varHours}h`}</span></div> },
            ].map(({ label, content }, i) => (
              <div key={label} style={{ paddingLeft: i === 0 ? 0 : 20, borderLeft: i === 0 ? "none" : "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                {typeof content === "string" ? <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{content}</div> : content}
              </div>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
          {[
            { label: "Total Tasks", value: tasks.length, icon: CheckSquare, color: "#4F46E5", bg: "#EEF2FF" },
            { label: "Completed", value: completedTasks, icon: Activity, color: "#059669", bg: "#ECFDF5" },
            { label: "Delayed / Overdue", value: delayedTasks, icon: AlertCircle, color: "#DC2626", bg: "#FEF2F2" },
            { label: "Team Members", value: teamSize, icon: Users, color: "#7C3AED", bg: "#F5F3FF" },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.icon size={17} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: s.color, letterSpacing: "-0.5px" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tasks Table */}
        <div className="card-lg" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              Tasks
              <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "1px 8px", borderRadius: 999 }}>{tasks.length}</span>
            </div>
            <button className="btn btn-primary" style={{ height: 32, fontSize: 12.5, gap: 5 }} onClick={() => setShowTaskModal(true)}>
              <Plus size={13} /> Add Task
            </button>
          </div>

          {tasks.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <CheckSquare size={28} style={{ color: "var(--text-tertiary)", margin: "0 auto 10px" }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>No tasks yet</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setShowTaskModal(true)}>
                <Plus size={12} /> Add First Task
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ minWidth: 820 }}>
                <colgroup>
                  <col style={{ width: "24%" }} /><col style={{ width: "12%" }} /><col style={{ width: "12%" }} />
                  <col style={{ width: "10%" }} /><col style={{ width: "12%" }} /><col style={{ width: "9%" }} />
                  <col style={{ width: "11%" }} /><col style={{ width: "10%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Task</th><th>Category</th><th>Status</th><th>Priority</th>
                    <th>Assignees</th><th>Est. Hours</th><th>Due</th><th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {(tasks as Record<string, unknown>[]).map(task => {
                    const assignees = (task.task_assignments as { team_members: { full_name: string } }[] ?? []);
                    return (
                      <tr key={task.id as string}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.3 }}>{task.name as string}</div>
                          {task.description ? <div style={{ fontSize: 11.5, marginTop: 3, color: "var(--text-tertiary)" }}>{String(task.description).slice(0, 60)}…</div> : null}
                        </td>
                        <td><span style={{ display: "inline-flex", padding: "2px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 500, background: "#F1F5F9", color: "#475569", textTransform: "capitalize" }}>{task.category as string}</span></td>
                        <td><StatusBadge status={task.status as string} /></td>
                        <td><PriorityBadge priority={task.priority as string} /></td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            {assignees.slice(0, 3).map((a, i) => (
                              <div key={i} title={a.team_members?.full_name} style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 2px #fff" }}>
                                {a.team_members?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                              </div>
                            ))}
                            {assignees.length > 3 && <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginLeft: 2 }}>+{assignees.length - 3}</span>}
                          </div>
                        </td>
                        <td style={{ fontSize: 13, fontWeight: 600 }}>{formatHours(task.estimated_hours as number)}</td>
                        <td style={{ fontSize: 12.5, fontWeight: 500 }}>{task.expected_end ? formatDate(task.expected_end as string) : "—"}</td>
                        <td style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{timeAgo(task.updated_at as string)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Milestones Section */}
        <div className="card-lg" style={{ overflow: "hidden", marginTop: 14 }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              Milestones
              <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "1px 8px", borderRadius: 999 }}>{milestones.length}</span>
            </div>
            <button className="btn btn-primary" style={{ height: 32, fontSize: 12.5, gap: 5 }} onClick={() => setShowMilestoneModal(true)}>
              <Plus size={13} /> Add Milestone
            </button>
          </div>
          {milestones.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <Flag size={28} style={{ color: "var(--text-tertiary)", margin: "0 auto 10px" }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>No milestones yet</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setShowMilestoneModal(true)}>
                <Plus size={12} /> Add First Milestone
              </button>
            </div>
          ) : (
            <div style={{ padding: "8px 0" }}>
              {milestones.map((ms) => {
                /* tasks assigned to THIS milestone (from live tasks list) */
                const msTaskIds = new Set(
                  tasks.filter(t => (t as any).milestone_id === ms.id).map(t => (t as any).id as string)
                );
                const assignedCount = msTaskIds.size;
                const completedCount = tasks.filter(t => (t as any).milestone_id === ms.id && (t as any).status === "completed").length;
                const isExpanded = expandedMilestone === ms.id;

                return (
                  <div key={ms.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    {/* ── Milestone header row ── */}
                    <div style={{ padding: "14px 22px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: MS_COLORS[ms.status]?.color ?? "#6B7280", flexShrink: 0 }} />
                          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ms.name}</div>
                          <MilestoneStatusDropdown value={ms.status} onSave={async (v) => { await updateMilestoneRecord(ms.id, { status: v }); reloadMilestones(); }} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                          {ms.start_date && (
                            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                              {formatDate(ms.start_date, "MMM d")} → {ms.end_date ? formatDate(ms.end_date, "MMM d") : "?"}
                            </span>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#059669" }}>
                            <DollarSign size={13} />
                            {Number(ms.cost).toLocaleString()}
                            {ms.is_paid && <span style={{ fontSize: 10, fontWeight: 700, background: "#ECFDF5", color: "#059669", padding: "1px 6px", borderRadius: 4 }}>PAID</span>}
                          </div>
                          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
                            <input type="checkbox" checked={ms.is_paid}
                              onChange={async (e) => { await updateMilestoneRecord(ms.id, { is_paid: e.target.checked }); reloadMilestones(); }}
                              style={{ accentColor: "#4F46E5" }} />
                            Paid
                          </label>
                          <button onClick={async () => { if (confirm("Delete this milestone?")) { await deleteMilestoneRecord(ms.id); reloadMilestones(); } }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 3, borderRadius: 4 }}
                            onMouseEnter={e => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.background = "#FEF2F2"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-tertiary)"; e.currentTarget.style.background = "none"; }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* ── Tasks summary + expand toggle ── */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--border-subtle)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <CheckSquare size={13} style={{ color: "var(--text-tertiary)" }} />
                          <span style={{ fontSize: 12.5, color: "var(--text-secondary)", fontWeight: 500 }}>
                            {assignedCount === 0
                              ? "No tasks assigned"
                              : `${completedCount}/${assignedCount} tasks completed`}
                          </span>
                          {assignedCount > 0 && (
                            <div style={{ display: "flex", gap: 3 }}>
                              {tasks
                                .filter(t => (t as any).milestone_id === ms.id)
                                .flatMap(t => (t as any).task_assignments as { team_members: { full_name: string } }[] ?? [])
                                .reduce<string[]>((acc, a) => {
                                  const n = a.team_members?.full_name;
                                  if (n && !acc.includes(n)) acc.push(n);
                                  return acc;
                                }, [])
                                .slice(0, 4)
                                .map((name, i) => (
                                  <div key={i} title={name} style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {name.charAt(0).toUpperCase()}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setExpandedMilestone(isExpanded ? null : ms.id)}
                          style={{ display: "flex", alignItems: "center", gap: 5, background: isExpanded ? "#EEF2FF" : "#F3F4F6", border: "1px solid " + (isExpanded ? "#C7D2FE" : "#E5E7EB"), color: isExpanded ? "#4F46E5" : "var(--text-secondary)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>
                          <CheckSquare size={12} />
                          {isExpanded ? "Hide tasks" : `Manage tasks (${tasks.length})`}
                          <ChevronDown size={11} style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                        </button>
                      </div>

                      {ms.notes && <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 6, fontStyle: "italic" }}>{ms.notes}</p>}
                    </div>

                    {/* ── Task picker (expandable) ── */}
                    {isExpanded && (() => {
                      const searchQ = (msTaskSearch[ms.id] ?? "").toLowerCase();

                      /* split all tasks into: assigned to this milestone / this project (not ms) / elsewhere */
                      const thisMsTasks   = allTasks.filter(t => (t as any).milestone_id === ms.id);
                      const thisProj      = allTasks.filter(t => (t as any).milestone_id !== ms.id && (t as any).project_id === id);
                      const elsewhere     = allTasks.filter(t => (t as any).milestone_id !== ms.id && (t as any).project_id !== id);

                      /* within each group keep only tasks with ≥1 developer assignment, then apply search */
                      const withDevs = (list: typeof allTasks) =>
                        list.filter(t => {
                          const assignees = ((t as any).assignments ?? (t as any).task_assignments ?? []) as unknown[];
                          if (assignees.length === 0) return false; // only assigned tasks
                          if (!searchQ) return true;
                          return (t.name ?? "").toLowerCase().includes(searchQ) ||
                            ((t as any).category ?? "").toLowerCase().includes(searchQ);
                        });

                      const groups: { label: string; accent: string; items: typeof allTasks }[] = [
                        { label: `In this milestone (${thisMsTasks.length})`,       accent: "#4F46E5", items: withDevs(thisMsTasks) },
                        { label: `Other tasks in this project (${thisProj.length})`, accent: "#059669", items: withDevs(thisProj) },
                        { label: `Tasks from other projects (${elsewhere.length})`,  accent: "#D97706", items: withDevs(elsewhere) },
                      ].filter(g => g.items.length > 0 || (!searchQ && g.label.startsWith("In this")));

                      const total = withDevs(allTasks).length;

                      return (
                        <div style={{ background: "#F9FAFB", borderTop: "1px solid var(--border-subtle)", padding: "12px 22px 16px" }}>
                          {/* Search bar */}
                          <div style={{ position: "relative", marginBottom: 12 }}>
                            <Search size={12} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
                            <input
                              autoFocus
                              value={msTaskSearch[ms.id] ?? ""}
                              onChange={e => setMsTaskSearch(prev => ({ ...prev, [ms.id]: e.target.value }))}
                              placeholder="Search tasks by name or category…"
                              style={{ width: "100%", paddingLeft: 28, paddingRight: 10, height: 32, fontSize: 12.5, border: "1px solid #E5E7EB", borderRadius: 7, outline: "none", background: "#fff" }}
                            />
                            {searchQ && (
                              <button onClick={() => setMsTaskSearch(prev => ({ ...prev, [ms.id]: "" }))}
                                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 0 }}>
                                <X size={12} />
                              </button>
                            )}
                          </div>

                          {total === 0 && (
                            <div style={{ fontSize: 13, color: "var(--text-tertiary)", padding: "8px 0" }}>
                              {searchQ ? "No matching tasks found." : "No tasks with developer assignments exist yet. Assign developers to tasks on the Tasks page first."}
                            </div>
                          )}

                          {groups.map(group => (
                            <div key={group.label} style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: group.accent, marginBottom: 5 }}>
                                {group.label}
                              </div>
                              {group.items.length === 0 ? (
                                <div style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "4px 0" }}>
                                  {searchQ ? "None match your search." : "No tasks here."}
                                </div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                  {group.items.map(t => {
                                    const taskId = t.id;
                                    const isAssignedHere = (t as any).milestone_id === ms.id;
                                    const isAssignedElsewhere = !isAssignedHere && (t as any).milestone_id != null;
                                    const elseMs = isAssignedElsewhere ? milestones.find(m => m.id === (t as any).milestone_id)?.name : null;
                                    const assignees = ((t as any).assignments ?? (t as any).task_assignments ?? []) as { team_members?: { full_name: string } }[];
                                    const isToggling = togglingTask === taskId;
                                    /* show which project this task belongs to if it's from elsewhere */
                                    const taskProject = (t as any).project as { name: string } | null | undefined;

                                    return (
                                      <label key={taskId} style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        padding: "7px 10px", borderRadius: 7, cursor: isToggling ? "wait" : "pointer",
                                        background: isAssignedHere ? "#EEF2FF" : "#fff",
                                        border: "1px solid " + (isAssignedHere ? "#C7D2FE" : "#E5E7EB"),
                                        opacity: isToggling ? 0.6 : 1, transition: "all 0.15s",
                                      }}>
                                        <input
                                          type="checkbox"
                                          checked={isAssignedHere}
                                          disabled={isToggling}
                                          onChange={e => handleTaskMilestoneToggle(taskId, ms.id, e.target.checked)}
                                          style={{ accentColor: "#4F46E5", width: 15, height: 15, flexShrink: 0, cursor: "pointer" }}
                                        />
                                        <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: t.status === "completed" ? "#059669" : t.status === "in progress" ? "#2563EB" : t.status === "paused" ? "#D97706" : "#9CA3AF" }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                                          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 1, display: "flex", gap: 6 }}>
                                            {t.category && <span style={{ textTransform: "capitalize" }}>{t.category}</span>}
                                            {taskProject?.name && <span>· {taskProject.name}</span>}
                                            {isAssignedElsewhere && elseMs && <span style={{ color: "#B45309" }}>· Currently in "{elseMs}" — will move here</span>}
                                          </div>
                                        </div>
                                        <StatusBadge status={t.status} />
                                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                          {assignees.slice(0, 3).map((a, i) => (
                                            <div key={i} title={a.team_members?.full_name} style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                              {a.team_members?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                                            </div>
                                          ))}
                                          {assignees.length > 3 && <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>+{assignees.length - 3}</span>}
                                        </div>
                                        <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>{formatHours(t.estimated_hours)}</span>
                                        {isToggling && <span style={{ fontSize: 11, color: "#4F46E5" }}>saving…</span>}
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}

                          <div style={{ marginTop: 6, fontSize: 11.5, color: "var(--text-tertiary)" }}>
                            {assignedCount} task{assignedCount !== 1 ? "s" : ""} assigned · {completedCount} completed
                            {searchQ && ` · showing results for "${searchQ}"`}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
              {/* Total cost footer */}
              <div style={{ padding: "12px 22px", background: "#F9FAFB", display: "flex", justifyContent: "flex-end", gap: 20 }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Total Milestone Value:</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#059669" }}>
                  ${milestones.reduce((s, m) => s + Number(m.cost), 0).toLocaleString()}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Paid:</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#4F46E5" }}>
                  ${milestones.filter(m => m.is_paid).reduce((s, m) => s + Number(m.cost), 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {p.notes && (
          <div className="card-lg" style={{ padding: "18px 22px", marginTop: 14, background: "#FFFBEB", border: "1px solid #FEF3C7" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#B45309", marginBottom: 8 }}>Project Notes</div>
            <p style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.6 }}>{p.notes}</p>
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Project" subtitle="Update project details and settings" size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label style={labelStyle}>Project Name <span style={{ color: "#EF4444" }}>*</span></label>
              <input className="input-base" value={editForm.name ?? ""} onChange={e => setEditForm((p: any) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select className="input-base" value={editForm.status ?? ""} onChange={e => setEditForm((p: any) => ({ ...p, status: e.target.value }))}>
                {["not started","active","in progress","on hold","completed","delayed","cancelled"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select className="input-base" value={editForm.priority ?? ""} onChange={e => setEditForm((p: any) => ({ ...p, priority: e.target.value }))}>
                {["critical","high","medium","low"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Health Status</label>
              <select className="input-base" value={editForm.health_status ?? ""} onChange={e => setEditForm((p: any) => ({ ...p, health_status: e.target.value }))}>
                {["healthy","at risk","critical"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <input className="input-base" value={editForm.category ?? ""} onChange={e => setEditForm((p: any) => ({ ...p, category: e.target.value }))} placeholder="e.g. software, design" />
            </div>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input type="date" className="input-base" value={editForm.start_date ?? ""} onChange={e => setEditForm((p: any) => ({ ...p, start_date: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input type="date" className="input-base" value={editForm.due_date ?? ""} onChange={e => setEditForm((p: any) => ({ ...p, due_date: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Estimated Hours</label>
              <input type="number" className="input-base" value={editForm.estimated_hours ?? 0} onChange={e => setEditForm((p: any) => ({ ...p, estimated_hours: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Progress %</label>
              <input type="number" min={0} max={100} className="input-base" value={editForm.progress_percent ?? 0} onChange={e => setEditForm((p: any) => ({ ...p, progress_percent: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label style={labelStyle}>Description</label>
              <textarea className="input-base" rows={2} value={editForm.description ?? ""} onChange={e => setEditForm((p: any) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label style={labelStyle}>Notes</label>
              <textarea className="input-base" rows={3} value={editForm.notes ?? ""} onChange={e => setEditForm((p: any) => ({ ...p, notes: e.target.value }))} placeholder="Internal notes about this project..." />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={saving} onClick={saveEdit} style={{ minWidth: 120 }}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </div>
      </Modal>

      {/* Add Task Modal */}
      <Modal open={showTaskModal} onClose={() => setShowTaskModal(false)} title="Add Task" subtitle={`Add a task to ${p.name}`} size="md">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label style={labelStyle}>Task Name <span style={{ color: "#EF4444" }}>*</span></label>
              <input className="input-base" required value={taskForm.name} onChange={e => setTaskForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select className="input-base" value={taskForm.category} onChange={e => setTaskForm(p => ({ ...p, category: e.target.value as TaskCategory }))}>
                {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select className="input-base" value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}>
                {["critical","high","medium","low"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Assign To</label>
              <select className="input-base" value={taskForm.assignee_id} onChange={e => setTaskForm(p => ({ ...p, assignee_id: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Milestone</label>
              <select className="input-base" value={taskForm.milestone_id} onChange={e => setTaskForm(p => ({ ...p, milestone_id: e.target.value }))}>
                <option value="">No milestone</option>
                {milestones.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Estimated Hours</label>
              <input type="number" className="input-base" value={taskForm.estimated_hours} onChange={e => setTaskForm(p => ({ ...p, estimated_hours: Number(e.target.value) }))} />
            </div>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input type="datetime-local" className="input-base" value={taskForm.expected_start} onChange={e => setTaskForm(p => ({ ...p, expected_start: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input type="datetime-local" className="input-base" value={taskForm.expected_end} onChange={e => setTaskForm(p => ({ ...p, expected_end: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label style={labelStyle}>Description</label>
              <textarea className="input-base" rows={2} value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={taskSaving} style={{ minWidth: 120 }}>{taskSaving ? "Creating…" : "Add Task"}</button>
          </div>
        </form>
      </Modal>

      {/* Add Milestone Modal */}
      <Modal open={showMilestoneModal} onClose={() => setShowMilestoneModal(false)} title="Add Milestone" subtitle={`Add a milestone to ${p.name}`} size="md">
        <form onSubmit={handleCreateMilestone} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label style={labelStyle}>Milestone Name <span style={{ color: "#EF4444" }}>*</span></label>
              <input className="input-base" required value={milestoneForm.name} onChange={e => setMilestoneForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input type="date" className="input-base" value={milestoneForm.start_date} onChange={e => setMilestoneForm(p => ({ ...p, start_date: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input type="date" className="input-base" value={milestoneForm.end_date} onChange={e => setMilestoneForm(p => ({ ...p, end_date: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Cost (Client Revenue) <span style={{ color: "#EF4444" }}>*</span></label>
              <input type="number" min={0} step={0.01} className="input-base" required value={milestoneForm.cost} onChange={e => setMilestoneForm(p => ({ ...p, cost: Number(e.target.value) }))} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select className="input-base" value={milestoneForm.status} onChange={e => setMilestoneForm(p => ({ ...p, status: e.target.value as MilestoneStatus }))}>
                {(["active","completed","on_hold","blocked"] as MilestoneStatus[]).map(s => <option key={s} value={s}>{s.replace("_"," ").replace(/^\w/, c => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label style={labelStyle}>Notes</label>
              <textarea className="input-base" rows={2} value={milestoneForm.notes} onChange={e => setMilestoneForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes about this milestone…" />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowMilestoneModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={milestoneSaving} style={{ minWidth: 130 }}>{milestoneSaving ? "Saving…" : "Add Milestone"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
