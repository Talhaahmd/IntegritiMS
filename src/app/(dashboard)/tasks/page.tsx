"use client";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { useTasks, createTaskRecord, updateTaskRecord } from "@/lib/hooks/useTasks";
import { useClients } from "@/lib/hooks/useClients";
import { useProjects } from "@/lib/hooks/useProjects";
import { useTeamMembers } from "@/lib/hooks/useTeam";
import { formatDate, formatHours } from "@/lib/utils";
import { CheckSquare, Plus, Search, AlertCircle, Clock, Play, Pause, CheckCircle2, Building2, FolderKanban, Timer, Calendar, Activity, CheckCircle, AlertTriangle, Hash, ListFilter } from "lucide-react";
import { Task, TASK_CATEGORIES, TASK_STATUSES, TaskCategory } from "@/types";
import { createClient as createSBClient } from "@/lib/supabase/client";

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: 5,
  letterSpacing: "0.01em",
};

/* ── Form Components ── */
function TaskFormField({ label, name, type = "text", required = false, value, onChange, placeholder }: any) {
  return (
    <div>
      <label style={labelStyle}>{label}{required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}</label>
      <input type={type} className="input-base" required={required} placeholder={placeholder ?? label} value={value} onChange={(e) => onChange(name, e.target.value)} />
    </div>
  );
}

function TaskFormSelect({ label, name, options, value, onChange, placeholder }: any) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select className="input-base" value={value} onChange={(e) => onChange(name, e.target.value)}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

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

  function handleChange(name: string, val: string) {
    setForm(p => ({ ...p, [name]: ["estimated_hours", "actual_hours"].includes(name) ? Number(val) : val }));
  }

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
        task_id: (newTask as any).id,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12 }}>General Information</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><TaskFormField label="Task Name" name="name" required value={form.name} onChange={handleChange} /></div>
          <TaskFormSelect label="Client" name="client_id" placeholder="Select client..." options={clients.map(c => ({ value: c.id, label: c.name }))} value={form.client_id} onChange={(n: string, v: string) => { handleChange(n, v); handleChange("project_id", ""); }} />
          <TaskFormSelect label="Project" name="project_id" placeholder="Select project..." options={filteredProjects.map(p => ({ value: p.id, label: p.name }))} value={form.project_id} onChange={handleChange} />
          <TaskFormSelect label="Category" name="category" options={TASK_CATEGORIES.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))} value={form.category} onChange={handleChange} />
          <TaskFormSelect label="Priority" name="priority" options={["critical","high","medium","low"].map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))} value={form.priority} onChange={handleChange} />
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12, paddingTop: 6, borderTop: "1px solid var(--border-subtle)" }}>Assignment & Time</div>
        <div className="grid grid-cols-2 gap-4">
          <TaskFormSelect label="Assign To" name="assignee_id" placeholder="Unassigned" options={members.map(m => ({ value: m.id, label: m.full_name }))} value={form.assignee_id} onChange={handleChange} />
          <TaskFormField label="Est. Hours" name="estimated_hours" type="number" value={form.estimated_hours} onChange={handleChange} />
          <TaskFormField label="Start Date" name="expected_start" type="datetime-local" value={form.expected_start} onChange={handleChange} />
          <TaskFormField label="End Date" name="expected_end" type="datetime-local" value={form.expected_end} onChange={handleChange} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea className="input-base" rows={2} placeholder="Brief task description..." value={form.description} onChange={(e) => handleChange("description", e.target.value)} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
        <button type="button" className="btn btn-secondary" onClick={onClose} style={{ height: 38, padding: "0 20px" }}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ height: 38, padding: "0 24px", minWidth: 120 }}>{saving ? "Creating…" : "Create Task"}</button>
      </div>
    </form>
  );
}

function StatCard({ label, value, color, bg, icon: Icon }: any) {
  return (
    <div className="card hover-lift" style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <div style={{ width: 24, height: 24, borderRadius: 6, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color }}>
        <Icon size={12} />
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color, letterSpacing: "-0.5px", marginTop: 2 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "capitalize" }}>{label}</div>
    </div>
  );
}

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
    const matchSearch = !q || t.name.toLowerCase().includes(q) || (t.client as { name: string })?.name?.toLowerCase().includes(q) || false;
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchCat = categoryFilter === "all" || t.category === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  async function handlePauseResume(task: Task) {
    setActionLoading(task.id);
    if (task.status === "paused") {
      const match = (task.notes ?? "").match(/\[PAUSED_AT:([^\]]+)\]/);
      const pausedAt = match ? new Date(match[1]) : null;
      let newEnd = task.expected_end;
      if (pausedAt && task.expected_end) {
        const diff = Date.now() - pausedAt.getTime();
        newEnd = new Date(new Date(task.expected_end).getTime() + diff).toISOString();
      }
      await updateTaskRecord(task.id, { status: "in progress", expected_end: newEnd ?? undefined, notes: (task.notes ?? "").replace(/\[PAUSED_AT:[^\]]+\]/g, "").trim() });
    } else {
      const marker = `[PAUSED_AT:${new Date().toISOString()}]`;
      await updateTaskRecord(task.id, { status: "paused", notes: task.notes ? `${task.notes} ${marker}` : marker });
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

      <div style={{ padding: "24px 28px 36px" }} className="animate-fade-up">
        
        {/* ── Toolbar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)" }}>
              <Search size={13} /> Search
            </div>
            <input className="input-base" style={{ height: 34, width: 200, fontSize: 13, background: "#fff" }} placeholder="Filter tasks..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="input-base" style={{ height: 34, width: 130, fontSize: 13, background: "#fff" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              {TASK_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select className="input-base" style={{ height: 34, width: 150, fontSize: 13, background: "#fff" }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" style={{ height: 34, padding: "0 16px", gap: 6, fontSize: 13, fontWeight: 700 }} onClick={() => setShowModal(true)}>
            <Plus size={14} /> New Task
          </button>
        </div>

        {/* ── Summary Cards ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <StatCard label="Total" value={tasks.length} color="#4F46E5" bg="#EEF2FF" icon={Hash} />
          <StatCard label="In Progress" value={tasks.filter(t => t.status === "in progress").length} color="#D97706" bg="#FFFBEB" icon={Clock} />
          <StatCard label="Paused" value={tasks.filter(t => t.status === "paused").length} color="#64748B" bg="#F1F5F9" icon={Pause} />
          <StatCard label="Completed" value={tasks.filter(t => t.status === "completed").length} color="#059669" bg="#ECFDF5" icon={CheckCircle2} />
          <StatCard label="Delayed" value={tasks.filter(t => t.status === "delayed").length} color="#DC2626" bg="#FEF2F2" icon={Timer} />
          <StatCard label="Overdue" value={tasks.filter(t => t.overdue).length} color="#B91C1C" bg="#FEF2F2" icon={AlertCircle} />
        </div>

        {/* ── Table ── */}
        <div className="card card-lg hover-lift" style={{ overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <EmptyState icon={CheckSquare} title="No tasks found" description="Adjust your filters or create a new task." action={<button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={13} />New Task</button>} />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "9%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ padding: "10px 12px" }}>TASK</th>
                    <th style={{ padding: "10px 12px" }}>CLIENT / PROJECT</th>
                    <th style={{ padding: "10px 12px" }}>STATUS</th>
                    <th style={{ padding: "10px 12px" }}>PRIORITY</th>
                    <th style={{ padding: "10px 12px" }}>ASSIGNEES</th>
                    <th style={{ padding: "10px 12px" }}>EST.</th>
                    <th style={{ padding: "10px 12px" }}>ACTUAL</th>
                    <th style={{ padding: "10px 12px" }}>DUE</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((task) => {
                    const assignees = (task.assignments ?? []) as any[];
                    const isDone = task.status === "completed";
                    const isPaused = task.status === "paused";
                    const varHours = task.actual_hours - task.estimated_hours;
                    
                    return (
                      <tr key={task.id} style={{ opacity: isPaused ? 0.7 : 1 }}>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={task.name}>{task.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, background: "var(--surface-2)", color: "var(--text-secondary)", textTransform: "capitalize", padding: "1px 6px", borderRadius: 3 }}>{task.category}</span>
                            {task.overdue && !isDone && <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 800, color: "#DC2626", textTransform: "uppercase" }}><AlertCircle size={10} /> Overdue</span>}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {(task.client as any)?.name ?? "—"}
                          </div>
                          <div style={{ fontSize: 10.5, color: "var(--text-tertiary)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {(task.project as any)?.name ?? "—"}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px" }}><StatusBadge status={task.status} /></td>
                        <td style={{ padding: "10px 12px" }}><PriorityBadge priority={task.priority} /></td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex" }}>
                            {assignees.slice(0, 2).map((a, i) => (
                              <div key={i} style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent)", color: "#fff", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #fff", marginLeft: i === 0 ? 0 : -6, zIndex: 5 - i }} title={a.team_members?.full_name}>
                                {a.team_members?.full_name?.charAt(0) ?? "?"}
                              </div>
                            ))}
                            {assignees.length > 2 && (
                              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--surface-2)", color: "var(--text-secondary)", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #fff", marginLeft: -6, zIndex: 1 }}>
                                +{assignees.length - 2}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12.5 }}>{task.estimated_hours}h</td>
                        <td style={{ padding: "10px 12px", fontSize: 12.5, fontWeight: 700, color: isDone ? (varHours > 0 ? "#DC2626" : "#059669") : "var(--text-primary)" }}>
                          {task.actual_hours}h
                          {isDone && varHours !== 0 && (
                            <span style={{ fontSize: 9, marginLeft: 2, fontWeight: 600 }}>({varHours > 0 ? `+${varHours}` : varHours})</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontSize: 11.5, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                            {task.expected_end ? formatDate(task.expected_end) : "—"}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                            {isDone ? (
                              <div style={{ color: "#059669" }} title="Completed"><CheckCircle2 size={15} /></div>
                            ) : (
                              <>
                                <button onClick={() => handlePauseResume(task)} disabled={!!actionLoading} style={{ width: 24, height: 24, borderRadius: 5, border: "1px solid var(--border)", background: "transparent", color: "var(--text-tertiary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title={isPaused ? "Resume" : "Pause"}>
                                  {isPaused ? <Play size={11} fill="currentColor" /> : <Pause size={11} fill="currentColor" />}
                                </button>
                                <button onClick={() => setCompleteTask(task)} style={{ width: 24, height: 24, borderRadius: 5, border: "1px solid var(--border)", background: "transparent", color: "var(--text-tertiary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Complete">
                                  <CheckCircle2 size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Task" subtitle="Add a new task to the system" size="lg">
        <TaskForm onSave={() => { setShowModal(false); reload(); }} onClose={() => setShowModal(false)} />
      </Modal>

      {/* Complete Task Modal */}
      <Modal open={!!completeTask} onClose={() => setCompleteTask(null)} title="Complete Task" size="sm">
        {completeTask && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ padding: 16, borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{completeTask.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>Record final hours and complete the task.</div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setCompleteTask(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                await updateTaskRecord(completeTask.id, { status: "completed", actual_end: new Date().toISOString() });
                setCompleteTask(null);
                reload();
              }}>Mark as Complete</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
