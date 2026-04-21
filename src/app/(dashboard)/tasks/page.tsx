"use client";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { useTasks, createTaskRecord } from "@/lib/hooks/useTasks";
import { useClients } from "@/lib/hooks/useClients";
import { useProjects } from "@/lib/hooks/useProjects";
import { useTeamMembers } from "@/lib/hooks/useTeam";
import { formatDate, formatHours, timeAgo } from "@/lib/utils";
import { CheckSquare, Plus, Search, AlertCircle, Clock, Play, Pause, CheckCircle2, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Task, TASK_CATEGORIES, TASK_STATUSES, TaskCategory } from "@/types";
import { createClient as createSBClient } from "@/lib/supabase/client";
import { updateTaskRecord } from "@/lib/hooks/useTasks";

function TaskForm({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const { data: clients } = useClients();
  const { data: projects } = useProjects();
  const { data: members } = useTeamMembers();
  const [form, setForm] = useState({
    name: "", description: "", client_id: "", project_id: "",
    category: "development" as TaskCategory, priority: "medium", status: "not started",
    estimated_hours: 0, actual_hours: 0,
    expected_start: "", expected_end: "",
    notes: "", assignee_id: "",
  });
  const [saving, setSaving] = useState(false);

  const filteredProjects = form.client_id ? projects.filter((p) => p.client_id === form.client_id) : projects;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { assignee_id, ...taskData } = form;
    const { data: newTask } = await createTaskRecord({
      ...taskData,
      client_id: form.client_id || null,
      project_id: form.project_id || null,
      expected_start: form.expected_start ? new Date(form.expected_start).toISOString() : null,
      expected_end: form.expected_end ? new Date(form.expected_end).toISOString() : null,
    } as Partial<Task>);

    if (newTask && assignee_id) {
      await createSBClient().from("task_assignments").insert({
        task_id: (newTask as { id: string }).id,
        team_member_id: assignee_id,
        estimated_hours: form.estimated_hours,
        actual_hours: 0,
        status: "not started",
      });
    }

    setSaving(false);
    onSave();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Task Name *</label>
          <input className="input-base" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Client</label>
          <select className="input-base" value={form.client_id} onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value, project_id: "" }))}>
            <option value="">No client…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Project</label>
          <select className="input-base" value={form.project_id} onChange={(e) => setForm((p) => ({ ...p, project_id: e.target.value }))}>
            <option value="">No project…</option>
            {filteredProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Category</label>
          <select className="input-base" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as TaskCategory }))}>
            {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Priority</label>
          <select className="input-base" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
            {["critical","high","medium","low"].map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Status</label>
          <select className="input-base" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            {TASK_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Assign To</label>
          <select className="input-base" value={form.assignee_id} onChange={(e) => setForm((p) => ({ ...p, assignee_id: e.target.value }))}>
            <option value="">Unassigned</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Estimated Hours</label>
          <input type="number" className="input-base" value={form.estimated_hours} onChange={(e) => setForm((p) => ({ ...p, estimated_hours: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Start Date</label>
          <input type="datetime-local" className="input-base" value={form.expected_start} onChange={(e) => setForm((p) => ({ ...p, expected_start: e.target.value }))} />
        </div>
        <div>
          <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>End Date</label>
          <input type="datetime-local" className="input-base" value={form.expected_end} onChange={(e) => setForm((p) => ({ ...p, expected_end: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Description</label>
        <textarea className="input-base" rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Creating…" : "Create Task"}</button>
      </div>
    </form>
  );
}

// ── Complete Task Modal ──────────────────────────────────────────────────────
function CompleteTaskModal({
  task,
  onClose,
  onDone,
}: {
  task: Task;
  onClose: () => void;
  onDone: () => void;
}) {
  const [onTime, setOnTime] = useState<boolean | null>(null);
  const [actualHours, setActualHours] = useState(task.actual_hours || task.estimated_hours);
  const [saving, setSaving] = useState(false);

  async function handleComplete() {
    setSaving(true);
    const now = new Date().toISOString();
    if (onTime === true) {
      await updateTaskRecord(task.id, {
        status: "completed",
        actual_hours: task.estimated_hours,
        actual_end: task.expected_end ?? now,
      });
    } else {
      await updateTaskRecord(task.id, {
        status: "completed",
        actual_hours: actualHours,
        actual_end: now,
      });
    }
    setSaving(false);
    onDone();
  }

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
        <div className="text-[13px] font-semibold text-gray-800">{task.name}</div>
        <div className="text-[12px] text-gray-400 mt-0.5">
          Estimated: {task.estimated_hours}h · Due: {task.expected_end ? formatDate(task.expected_end) : "—"}
        </div>
      </div>

      <div>
        <p className="text-[13.5px] font-medium text-gray-700 mb-3">Was this task completed on time?</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setOnTime(true)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              onTime === true
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-100 bg-white hover:border-gray-200"
            }`}
          >
            <CheckCircle2 size={22} className={onTime === true ? "text-emerald-600" : "text-gray-300"} />
            <span className={`text-[13px] font-semibold ${onTime === true ? "text-emerald-700" : "text-gray-500"}`}>
              Yes, on time
            </span>
            <span className="text-[11px] text-gray-400">Actual = estimated ({task.estimated_hours}h)</span>
          </button>
          <button
            type="button"
            onClick={() => setOnTime(false)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              onTime === false
                ? "border-red-400 bg-red-50"
                : "border-gray-100 bg-white hover:border-gray-200"
            }`}
          >
            <Clock size={22} className={onTime === false ? "text-red-500" : "text-gray-300"} />
            <span className={`text-[13px] font-semibold ${onTime === false ? "text-red-600" : "text-gray-500"}`}>
              No, took longer
            </span>
            <span className="text-[11px] text-gray-400">Enter actual hours below</span>
          </button>
        </div>
      </div>

      {onTime === false && (
        <div>
          <label className="block text-[12.5px] font-medium mb-1.5 text-gray-500">Actual Hours Taken</label>
          <input
            type="number"
            className="input-base w-40"
            min={0}
            step={0.5}
            value={actualHours}
            onChange={(e) => setActualHours(Number(e.target.value))}
          />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={onTime === null || saving}
          onClick={handleComplete}
        >
          {saving ? "Saving…" : "Mark Complete"}
        </button>
      </div>
    </div>
  );
}

// ── Pause marker helpers ──────────────────────────────────────────────────────
const PAUSE_PREFIX = "[PAUSED_AT:";

function getPauseTime(notes: string | null): Date | null {
  if (!notes) return null;
  const match = notes.match(/\[PAUSED_AT:([^\]]+)\]/);
  return match ? new Date(match[1]) : null;
}

function removePauseMarker(notes: string | null): string {
  return (notes ?? "").replace(/\[PAUSED_AT:[^\]]+\]/g, "").trim();
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const { data: tasks, loading, reload } = useTasks();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [completeTask, setCompleteTask] = useState<Task | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || (t.client as { name: string } | undefined)?.name?.toLowerCase().includes(q) || false;
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchCat = categoryFilter === "all" || t.category === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  async function handlePauseResume(task: Task) {
    setActionLoading(task.id);
    if (task.status === "paused") {
      // Resume: calculate pause duration, extend expected_end
      const pausedAt = getPauseTime(task.notes);
      let newExpectedEnd = task.expected_end;
      if (pausedAt && task.expected_end) {
        const pauseDuration = Date.now() - pausedAt.getTime();
        const originalEnd = new Date(task.expected_end);
        newExpectedEnd = new Date(originalEnd.getTime() + pauseDuration).toISOString();
      }
      await updateTaskRecord(task.id, {
        status: "in progress",
        expected_end: newExpectedEnd ?? undefined,
        notes: removePauseMarker(task.notes),
      });
    } else {
      // Pause: set status and store pause timestamp in notes
      const pauseMarker = `${PAUSE_PREFIX}${new Date().toISOString()}]`;
      await updateTaskRecord(task.id, {
        status: "paused",
        notes: task.notes ? `${task.notes} ${pauseMarker}` : pauseMarker,
      });
    }
    setActionLoading(null);
    reload();
  }

  if (loading) return (
    <>
      <TopBar title="Tasks" />
      <PageLoader />
    </>
  );

  return (
    <>
      <TopBar title="Tasks" subtitle={`${tasks.length} total tasks`} />

      <div className="p-8 animate-fade-in">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
              <input className="input-base pl-9 h-9 w-64" placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="input-base h-9 w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              {TASK_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select className="input-base h-9 w-44" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> New Task</button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          {[
            { label: "Total", value: tasks.length, color: "#6366F1", bg: "#EEF2FF" },
            { label: "In Progress", value: tasks.filter((t) => t.status === "in progress").length, color: "#F59E0B", bg: "#FFFBEB" },
            { label: "Paused", value: tasks.filter((t) => t.status === "paused").length, color: "#64748B", bg: "#F8FAFC" },
            { label: "Completed", value: tasks.filter((t) => t.status === "completed").length, color: "#10B981", bg: "#ECFDF5" },
            { label: "Delayed", value: tasks.filter((t) => t.status === "delayed").length, color: "#EF4444", bg: "#FEF2F2" },
            { label: "Overdue", value: tasks.filter((t) => t.overdue).length, color: "#DC2626", bg: "#FEF2F2" },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="w-8 h-8 rounded-xl mb-3 flex items-center justify-center" style={{ background: s.bg }}>
                <CheckSquare size={14} style={{ color: s.color }} />
              </div>
              <div className="text-[22px] font-semibold tracking-tight" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[12px] mt-0.5 text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card-lg overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={CheckSquare} title="No tasks found" description="Create your first task to get started." action={
              <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={13} />New Task</button>
            } />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Client / Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignees</th>
                  <th>Est.</th>
                  <th>Actual</th>
                  <th>Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => {
                  const assignees = (task.assignments ?? []) as { team_members?: { full_name: string } }[];
                  const varHours = task.actual_hours - task.estimated_hours;
                  const isDone = task.status === "completed";
                  const isPaused = task.status === "paused";
                  const isActing = actionLoading === task.id;
                  return (
                    <tr key={task.id} className={isPaused ? "opacity-60" : ""}>
                      <td>
                        <div className="font-medium text-[13.5px]">{task.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="chip bg-slate-100 text-slate-600 capitalize text-[10.5px]">{task.category}</span>
                          {isPaused && (
                            <span className="chip bg-amber-50 text-amber-700 text-[10.5px]">⏸ Paused</span>
                          )}
                          {task.overdue && (
                            <span className="flex items-center gap-0.5 text-red-500 text-[10.5px]">
                              <AlertCircle size={10} /> Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="text-[12.5px] font-medium">
                          {(task.client as { name: string } | undefined)?.name ?? "—"}
                        </div>
                        <div className="text-[11.5px] text-gray-400">
                          {(task.project as { name: string } | undefined)?.name ?? ""}
                        </div>
                      </td>
                      <td><StatusBadge status={task.status} /></td>
                      <td><PriorityBadge priority={task.priority} /></td>
                      <td>
                        <div className="flex -space-x-1.5">
                          {assignees.slice(0, 3).map((a, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                              {a.team_members?.full_name?.charAt(0) ?? "?"}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="text-[13px]">{formatHours(task.estimated_hours)}</td>
                      <td className="text-[13px]">
                        <span className={varHours > 0 && isDone ? "text-red-500" : isDone ? "text-emerald-600" : ""}>
                          {formatHours(task.actual_hours)}
                          {isDone && (
                            <span className="ml-1 text-[11px]">
                              ({varHours > 0 ? `+${varHours}h` : `${varHours}h`})
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="text-[12.5px]">
                        {task.expected_end ? (
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-gray-400" />
                            {formatDate(task.expected_end)}
                          </span>
                        ) : "—"}
                      </td>
                      <td>
                        {isDone ? (
                          <span className="flex items-center gap-1 text-emerald-600 text-[12px] font-medium">
                            <CheckCircle2 size={13} /> Done
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {/* Pause / Resume */}
                            <button
                              title={isPaused ? "Resume task" : "Pause task"}
                              disabled={isActing}
                              onClick={() => handlePauseResume(task)}
                              className={`btn btn-icon btn-sm border transition-colors ${
                                isPaused
                                  ? "border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                  : "border-gray-100 bg-white text-gray-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
                              }`}
                            >
                              {isPaused ? <Play size={11} /> : <Pause size={11} />}
                            </button>
                            {/* Complete */}
                            {!isPaused && (
                              <button
                                title="Mark complete"
                                onClick={() => setCompleteTask(task)}
                                className="btn btn-icon btn-sm border border-gray-100 bg-white text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                              >
                                <CheckCircle2 size={11} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create task modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Task" size="xl">
        <TaskForm onSave={() => { setShowModal(false); reload(); }} onClose={() => setShowModal(false)} />
      </Modal>

      {/* Complete task modal */}
      <Modal
        open={!!completeTask}
        onClose={() => setCompleteTask(null)}
        title="Complete Task"
        subtitle="Record completion details"
        size="sm"
      >
        {completeTask && (
          <CompleteTaskModal
            task={completeTask}
            onClose={() => setCompleteTask(null)}
            onDone={() => { setCompleteTask(null); reload(); }}
          />
        )}
      </Modal>
    </>
  );
}
