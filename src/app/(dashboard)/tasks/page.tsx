"use client";
import { useState, useRef, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { useTasks, createTaskRecord, updateTaskRecord } from "@/lib/hooks/useTasks";
import { useClients } from "@/lib/hooks/useClients";
import { useProjects } from "@/lib/hooks/useProjects";
import { useTeamMembers } from "@/lib/hooks/useTeam";
import { formatDate } from "@/lib/utils";
import {
  CheckSquare, Plus, Search, AlertCircle, Clock, Pause,
  CheckCircle2, Timer, Hash, ChevronDown, Filter, X,
} from "lucide-react";
import { Task, TASK_CATEGORIES, TASK_STATUSES, TaskStatus, TaskCategory } from "@/types";
import { createClient as createSBClient } from "@/lib/supabase/client";

/* ── helpers ── */
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "var(--text-secondary)", marginBottom: 5,
};

function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3600_000).toISOString();
}

/* ── SearchableDropdown ── */
function SearchableDropdown({
  trigger, items, onSelect, width = 220,
}: {
  trigger: React.ReactNode;
  items: { value: string; label: string }[];
  onSelect: (value: string) => void;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery("");
  }, [open]);

  const filtered = items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <div onClick={() => setOpen(o => !o)} style={{ cursor: "pointer" }}>{trigger}</div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 1000,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 10, boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
          width, overflow: "hidden",
        }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ position: "relative" }}>
              <Search size={12} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search..."
                style={{
                  width: "100%", height: 30, borderRadius: 6, border: "1px solid var(--border)",
                  paddingLeft: 26, paddingRight: 8, fontSize: 12, outline: "none",
                  background: "var(--surface-2)", boxSizing: "border-box",
                }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            <div
              onClick={() => { onSelect(""); setOpen(false); }}
              style={{ padding: "8px 12px", fontSize: 12, color: "var(--text-tertiary)", cursor: "pointer", fontStyle: "italic" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              — None —
            </div>
            {filtered.length === 0 && (
              <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--text-tertiary)", textAlign: "center" }}>No results</div>
            )}
            {filtered.map(item => (
              <div
                key={item.value}
                onClick={() => { onSelect(item.value); setOpen(false); }}
                style={{ padding: "8px 12px", fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── InlineDropdown (for status/assignee) ── */
function InlineDropdown({ trigger, children, width = 180 }: { trigger: React.ReactNode; children: React.ReactNode; width?: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <div onClick={() => setOpen(o => !o)} style={{ cursor: "pointer" }}>{trigger}</div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 999, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: width, overflow: "hidden" }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Status cell ── */
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  "not started": { bg: "#F1F5F9", color: "#64748B" },
  "scheduled":   { bg: "#EFF6FF", color: "#3B82F6" },
  "in progress": { bg: "#FFFBEB", color: "#D97706" },
  "paused":      { bg: "#F5F3FF", color: "#7C3AED" },
  "completed":   { bg: "#ECFDF5", color: "#059669" },
  "delayed":     { bg: "#FEF2F2", color: "#DC2626" },
  "blocked":     { bg: "#FFF7ED", color: "#EA580C" },
};

function StatusCell({ task, onUpdate }: { task: Task; onUpdate: () => void }) {
  const [saving, setSaving] = useState(false);
  const sc = STATUS_COLORS[task.status] ?? STATUS_COLORS["not started"];

  async function handleSelect(newStatus: TaskStatus) {
    setSaving(true);
    if (newStatus === "paused" && task.status !== "paused") {
      const marker = `[PAUSED_AT:${new Date().toISOString()}]`;
      await updateTaskRecord(task.id, { status: "paused", notes: task.notes ? `${task.notes} ${marker}` : marker });
    } else if (newStatus === "in progress" && task.status === "paused") {
      const match = (task.notes ?? "").match(/\[PAUSED_AT:([^\]]+)\]/);
      const pausedAt = match ? new Date(match[1]) : null;
      let newEnd = task.expected_end;
      if (pausedAt && task.expected_end) {
        const diff = Date.now() - pausedAt.getTime();
        newEnd = new Date(new Date(task.expected_end).getTime() + diff).toISOString();
      }
      await updateTaskRecord(task.id, { status: "in progress", expected_end: newEnd ?? undefined, notes: (task.notes ?? "").replace(/\[PAUSED_AT:[^\]]+\]/g, "").trim() });
    } else if (newStatus === "completed") {
      await updateTaskRecord(task.id, { status: "completed", actual_end: new Date().toISOString() });
    } else {
      await updateTaskRecord(task.id, { status: newStatus });
    }
    setSaving(false);
    onUpdate();
  }

  return (
    <InlineDropdown width={150} trigger={
      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 20, background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${sc.color}22`, opacity: saving ? 0.6 : 1 }}>
        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}<ChevronDown size={10} />
      </div>
    }>
      {TASK_STATUSES.map(s => {
        const c = STATUS_COLORS[s] ?? STATUS_COLORS["not started"];
        return (
          <div key={s} onClick={() => handleSelect(s)} style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600, color: c.color, cursor: "pointer", background: task.status === s ? c.bg : "transparent" }}
            onMouseEnter={e => (e.currentTarget.style.background = c.bg)}
            onMouseLeave={e => (e.currentTarget.style.background = task.status === s ? c.bg : "transparent")}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </div>
        );
      })}
    </InlineDropdown>
  );
}

/* ── Assignee cell ── */
function AssigneeCell({ task, members, onUpdate }: { task: Task; members: any[]; onUpdate: () => void }) {
  const assignees = (task.assignments ?? []) as any[];
  const [saving, setSaving] = useState(false);

  async function handleAssign(memberId: string) {
    setSaving(true);
    const sb = createSBClient();
    await sb.from("task_assignments").delete().eq("task_id", task.id);
    if (memberId) {
      await sb.from("task_assignments").insert({ task_id: task.id, team_member_id: memberId, estimated_hours: task.estimated_hours, actual_hours: 0, status: task.status });
    }
    setSaving(false);
    onUpdate();
  }

  const currentAssignee = assignees[0]?.team_members;

  return (
    <InlineDropdown width={190} trigger={
      <div style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", padding: "2px 6px", borderRadius: 6, border: "1px dashed var(--border)", opacity: saving ? 0.5 : 1 }}>
        {currentAssignee ? (
          <>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent)", color: "#fff", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {currentAssignee.full_name?.charAt(0) ?? "?"}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentAssignee.full_name}</span>
          </>
        ) : (
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Unassigned</span>
        )}
        <ChevronDown size={9} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
      </div>
    }>
      <div style={{ padding: "6px 0" }}>
        <div onClick={() => handleAssign("")} style={{ padding: "7px 12px", fontSize: 12, color: "var(--text-tertiary)", cursor: "pointer", fontStyle: "italic" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>Unassigned</div>
        {members.map(m => (
          <div key={m.id} onClick={() => handleAssign(m.id)} style={{ padding: "7px 12px", fontSize: 12, fontWeight: 600, color: "var(--text-primary)", cursor: "pointer", background: currentAssignee?.id === m.id ? "var(--surface-2)" : "transparent", display: "flex", alignItems: "center", gap: 8 }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
            onMouseLeave={e => (e.currentTarget.style.background = currentAssignee?.id === m.id ? "var(--surface-2)" : "transparent")}
          >
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--accent)", color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{m.full_name?.charAt(0)}</div>
            {m.full_name}
          </div>
        ))}
      </div>
    </InlineDropdown>
  );
}

/* ── Editable number cell ── */
function EditableNumberCell({ value, onChange, label }: { value: number; onChange: (v: string) => Promise<void>; label: string }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() { setLocal(String(value)); setEditing(true); setTimeout(() => inputRef.current?.focus(), 0); }
  async function commit() { setEditing(false); if (local !== String(value)) await onChange(local); }

  if (editing) return (
    <input ref={inputRef} value={local} onChange={e => setLocal(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
      type="number" style={{ width: "100%", fontSize: 12.5, fontWeight: 600, border: "1px solid var(--accent)", borderRadius: 5, padding: "2px 6px", outline: "none", background: "var(--surface)" }} />
  );
  return (
    <div onClick={startEdit} title={`Click to edit ${label}`} style={{ fontSize: 12.5, cursor: "pointer", padding: "2px 6px", borderRadius: 5, border: "1px dashed transparent" }}
      onMouseEnter={e => (e.currentTarget.style.border = "1px dashed var(--border)")}
      onMouseLeave={e => (e.currentTarget.style.border = "1px dashed transparent")}
    >{value}h</div>
  );
}

/* ── Client/Project cell with searchable dropdown ── */
function ClientProjectCell({ task, clients, projects, onUpdate }: { task: Task; clients: any[]; projects: any[]; onUpdate: () => void }) {
  const clientName = (task.client as any)?.name;
  const projectName = (task.project as any)?.name;

  async function handleClientChange(clientId: string) {
    await updateTaskRecord(task.id, { client_id: clientId || null, project_id: null });
    onUpdate();
  }

  async function handleProjectChange(projectId: string) {
    const proj = projects.find(p => p.id === projectId);
    await updateTaskRecord(task.id, { project_id: projectId || null, client_id: proj?.client_id ?? task.client_id });
    onUpdate();
  }

  const relevantProjects = task.client_id ? projects.filter(p => p.client_id === task.client_id) : projects;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <SearchableDropdown
        items={clients.map(c => ({ value: c.id, label: c.name }))}
        onSelect={handleClientChange}
        width={210}
        trigger={
          <div style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", padding: "1px 5px", borderRadius: 4, border: "1px dashed transparent" }}
            onMouseEnter={e => (e.currentTarget.style.border = "1px dashed var(--border)")}
            onMouseLeave={e => (e.currentTarget.style.border = "1px dashed transparent")}
          >
            <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {clientName ?? <span style={{ color: "var(--text-tertiary)" }}>—</span>}
            </span>
            <ChevronDown size={9} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          </div>
        }
      />
      <SearchableDropdown
        items={relevantProjects.map(p => ({ value: p.id, label: p.name }))}
        onSelect={handleProjectChange}
        width={210}
        trigger={
          <div style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", padding: "1px 5px", borderRadius: 4, border: "1px dashed transparent" }}
            onMouseEnter={e => (e.currentTarget.style.border = "1px dashed var(--border)")}
            onMouseLeave={e => (e.currentTarget.style.border = "1px dashed transparent")}
          >
            <span style={{ fontSize: 11, color: "var(--text-tertiary)", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {projectName ?? <span style={{ fontStyle: "italic" }}>No project</span>}
            </span>
            <ChevronDown size={8} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          </div>
        }
      />
    </div>
  );
}

/* ── Form helpers ── */
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
    estimated_hours: 0, actual_hours: 0, expected_start: "", expected_end: "", notes: "", assignee_id: "",
  });
  const [saving, setSaving] = useState(false);

  function handleChange(name: string, val: string) {
    setForm(p => {
      const next = { ...p, [name]: ["estimated_hours", "actual_hours"].includes(name) ? Number(val) : val };
      if ((name === "expected_start" || name === "estimated_hours") && next.expected_start && next.estimated_hours) {
        next.expected_end = addHours(next.expected_start, next.estimated_hours).slice(0, 16);
      }
      return next;
    });
  }

  const filteredProjects = form.client_id ? projects.filter(p => p.client_id === form.client_id) : projects;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { assignee_id, ...taskData } = form;
    const { data: newTask } = await createTaskRecord({
      ...taskData,
      client_id: form.client_id || null, project_id: form.project_id || null,
      expected_start: form.expected_start ? new Date(form.expected_start).toISOString() : null,
      expected_end: form.expected_end ? new Date(form.expected_end).toISOString() : null,
    } as Partial<Task>);
    if (newTask && assignee_id) {
      await createSBClient().from("task_assignments").insert({ task_id: (newTask as any).id, team_member_id: assignee_id, estimated_hours: form.estimated_hours, actual_hours: 0, status: "not started" });
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
          <TaskFormSelect label="Priority" name="priority" options={["critical", "high", "medium", "low"].map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))} value={form.priority} onChange={handleChange} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12, paddingTop: 6, borderTop: "1px solid var(--border-subtle)" }}>Assignment & Time</div>
        <div className="grid grid-cols-2 gap-4">
          <TaskFormSelect label="Assign To" name="assignee_id" placeholder="Unassigned" options={members.map(m => ({ value: m.id, label: m.full_name }))} value={form.assignee_id} onChange={handleChange} />
          <TaskFormField label="Est. Hours" name="estimated_hours" type="number" value={form.estimated_hours} onChange={handleChange} />
          <TaskFormField label="Start Date" name="expected_start" type="datetime-local" value={form.expected_start} onChange={handleChange} />
          <TaskFormField label="End Date (auto)" name="expected_end" type="datetime-local" value={form.expected_end} onChange={handleChange} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea className="input-base" rows={2} placeholder="Brief task description..." value={form.description} onChange={e => handleChange("description", e.target.value)} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 120 }}>{saving ? "Creating…" : "Create Task"}</button>
      </div>
    </form>
  );
}

function StatCard({ label, value, color, bg, icon: Icon }: any) {
  return (
    <div className="card hover-lift" style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <div style={{ width: 24, height: 24, borderRadius: 6, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color }}><Icon size={12} /></div>
      <div style={{ fontSize: 20, fontWeight: 700, color, letterSpacing: "-0.5px", marginTop: 2 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "capitalize" }}>{label}</div>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px 3px 10px", borderRadius: 20, background: "var(--accent)15", border: "1px solid var(--accent)40", fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>
      {label}
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", display: "flex", padding: 0 }}><X size={11} /></button>
    </div>
  );
}

/* ── Main page ── */
export default function TasksPage() {
  const { data: tasks, loading, reload } = useTasks();
  const { data: members } = useTeamMembers();
  const { data: clients } = useClients();
  const { data: projects } = useProjects();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const activeFilterCount = [
    memberFilter !== "all", projectFilter !== "all", dateFrom !== "",
    dateTo !== "", statusFilter !== "all", categoryFilter !== "all",
  ].filter(Boolean).length;

  const filtered = tasks.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || (t.client as any)?.name?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchCat = categoryFilter === "all" || t.category === categoryFilter;
    const matchMember = memberFilter === "all" || (t.assignments ?? []).some((a: any) => a.team_member_id === memberFilter);
    const matchProject = projectFilter === "all" || t.project_id === projectFilter;
    const taskStart = t.expected_start ? new Date(t.expected_start) : null;
    const taskEnd = t.expected_end ? new Date(t.expected_end) : null;
    const matchDateFrom = !dateFrom || (taskStart && taskStart >= new Date(dateFrom)) || (taskEnd && taskEnd >= new Date(dateFrom));
    const matchDateTo = !dateTo || (taskStart && taskStart <= new Date(dateTo + "T23:59:59")) || (taskEnd && taskEnd <= new Date(dateTo + "T23:59:59"));
    return matchSearch && matchStatus && matchCat && matchMember && matchProject && matchDateFrom && matchDateTo;
  });

  async function handleUpdateStart(task: Task, val: string) {
    if (!val) return;
    const iso = new Date(val).toISOString();
    const newEnd = task.estimated_hours ? addHours(iso, task.estimated_hours) : task.expected_end;
    await updateTaskRecord(task.id, { expected_start: iso, expected_end: newEnd ?? undefined });
    reload();
  }

  async function handleUpdateEstHours(task: Task, val: string) {
    const hours = parseFloat(val);
    if (isNaN(hours)) return;
    const newEnd = task.expected_start ? addHours(task.expected_start, hours) : task.expected_end;
    await updateTaskRecord(task.id, { estimated_hours: hours, expected_end: newEnd ?? undefined });
    reload();
  }

  async function handleUpdateActualHours(task: Task, val: string) {
    const hours = parseFloat(val);
    if (isNaN(hours)) return;
    await updateTaskRecord(task.id, { actual_hours: hours });
    reload();
  }

  if (loading) return <><TopBar title="Tasks" /><PageLoader /></>;

  return (
    <>
      <TopBar title="Tasks" subtitle={`${tasks.length} total tasks`} />
      <div style={{ padding: "24px 28px 36px" }} className="animate-fade-up">

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
              <input className="input-base" style={{ height: 34, width: 200, fontSize: 13, paddingLeft: 28 }} placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-secondary" style={{ height: 34, padding: "0 12px", gap: 6, fontSize: 13, fontWeight: 600, position: "relative" }} onClick={() => setShowFilters(f => !f)}>
              <Filter size={13} /> Filters
              {activeFilterCount > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "var(--accent)", color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{activeFilterCount}</span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button onClick={() => { setStatusFilter("all"); setCategoryFilter("all"); setMemberFilter("all"); setProjectFilter("all"); setDateFrom(""); setDateTo(""); }} style={{ fontSize: 11, color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <X size={11} /> Clear all
              </button>
            )}
          </div>
          <button className="btn btn-primary" style={{ height: 34, padding: "0 16px", gap: 6, fontSize: 13, fontWeight: 700 }} onClick={() => setShowModal(true)}>
            <Plus size={14} /> New Task
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
            <div>
              <label style={{ ...labelStyle, marginBottom: 4 }}>Status</label>
              <select className="input-base" style={{ height: 32, width: 130, fontSize: 12 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                {TASK_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ ...labelStyle, marginBottom: 4 }}>Category</label>
              <select className="input-base" style={{ height: 32, width: 130, fontSize: 12 }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="all">All Categories</option>
                {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ ...labelStyle, marginBottom: 4 }}>Team Member</label>
              <select className="input-base" style={{ height: 32, width: 160, fontSize: 12 }} value={memberFilter} onChange={e => setMemberFilter(e.target.value)}>
                <option value="all">All Members</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ ...labelStyle, marginBottom: 4 }}>Project</label>
              <select className="input-base" style={{ height: 32, width: 160, fontSize: 12 }} value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
                <option value="all">All Projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ ...labelStyle, marginBottom: 4 }}>From Date</label>
              <input type="date" className="input-base" style={{ height: 32, fontSize: 12 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label style={{ ...labelStyle, marginBottom: 4 }}>To Date</label>
              <input type="date" className="input-base" style={{ height: 32, fontSize: 12 }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <button className="btn btn-secondary" style={{ height: 32, fontSize: 12 }} onClick={() => setShowFilters(false)}>Done</button>
          </div>
        )}

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {memberFilter !== "all" && <Chip label={`Member: ${members.find(m => m.id === memberFilter)?.full_name ?? memberFilter}`} onRemove={() => setMemberFilter("all")} />}
            {projectFilter !== "all" && <Chip label={`Project: ${projects.find(p => p.id === projectFilter)?.name ?? projectFilter}`} onRemove={() => setProjectFilter("all")} />}
            {statusFilter !== "all" && <Chip label={`Status: ${statusFilter}`} onRemove={() => setStatusFilter("all")} />}
            {categoryFilter !== "all" && <Chip label={`Category: ${categoryFilter}`} onRemove={() => setCategoryFilter("all")} />}
            {dateFrom && <Chip label={`From: ${dateFrom}`} onRemove={() => setDateFrom("")} />}
            {dateTo && <Chip label={`To: ${dateTo}`} onRemove={() => setDateTo("")} />}
          </div>
        )}

        {/* Summary Cards */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <StatCard label="Total" value={tasks.length} color="#4F46E5" bg="#EEF2FF" icon={Hash} />
          <StatCard label="In Progress" value={tasks.filter(t => t.status === "in progress").length} color="#D97706" bg="#FFFBEB" icon={Clock} />
          <StatCard label="Paused" value={tasks.filter(t => t.status === "paused").length} color="#64748B" bg="#F1F5F9" icon={Pause} />
          <StatCard label="Completed" value={tasks.filter(t => t.status === "completed").length} color="#059669" bg="#ECFDF5" icon={CheckCircle2} />
          <StatCard label="Delayed" value={tasks.filter(t => t.status === "delayed").length} color="#DC2626" bg="#FEF2F2" icon={Timer} />
          <StatCard label="Overdue" value={tasks.filter(t => t.overdue).length} color="#B91C1C" bg="#FEF2F2" icon={AlertCircle} />
        </div>

        {/* Table */}
        <div className="card card-lg hover-lift" style={{ overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <EmptyState icon={CheckSquare} title="No tasks found" description="Adjust your filters or create a new task." action={<button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={13} />New Task</button>} />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "9%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ padding: "10px 12px" }}>TASK</th>
                    <th style={{ padding: "10px 12px" }}>CLIENT / PROJECT</th>
                    <th style={{ padding: "10px 12px" }}>STATUS</th>
                    <th style={{ padding: "10px 12px" }}>PRI.</th>
                    <th style={{ padding: "10px 12px" }}>ASSIGNEE</th>
                    <th style={{ padding: "10px 12px" }}>EST. HRS</th>
                    <th style={{ padding: "10px 12px" }}>ACTUAL HRS</th>
                    <th style={{ padding: "10px 12px" }}>START</th>
                    <th style={{ padding: "10px 12px" }}>DUE</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(task => {
                    const isDone = task.status === "completed";
                    return (
                      <tr key={task.id} style={{ opacity: task.status === "paused" ? 0.7 : 1 }}>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={task.name}>{task.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, background: "var(--surface-2)", color: "var(--text-secondary)", textTransform: "capitalize", padding: "1px 6px", borderRadius: 3 }}>{task.category}</span>
                            {task.overdue && !isDone && <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 800, color: "#DC2626", textTransform: "uppercase" }}><AlertCircle size={10} /> Overdue</span>}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <ClientProjectCell task={task} clients={clients} projects={projects} onUpdate={reload} />
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <StatusCell task={task} onUpdate={reload} />
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <PriorityBadge priority={task.priority} />
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <AssigneeCell task={task} members={members} onUpdate={reload} />
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <EditableNumberCell label="estimated hours" value={task.estimated_hours} onChange={v => handleUpdateEstHours(task, v)} />
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <EditableNumberCell label="actual hours" value={task.actual_hours} onChange={v => handleUpdateActualHours(task, v)} />
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
                            {task.expected_start ? formatDate(task.expected_start) : "—"}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontSize: 11.5, color: task.overdue && !isDone ? "#DC2626" : "var(--text-secondary)", fontWeight: task.overdue && !isDone ? 700 : 400, whiteSpace: "nowrap" }}>
                            {task.expected_end ? formatDate(task.expected_end) : "—"}
                          </div>
                          {task.status === "paused" && <div style={{ fontSize: 9, color: "#7C3AED", fontWeight: 600, marginTop: 2 }}>⏸ Frozen</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ padding: "8px 12px", fontSize: 11, color: "var(--text-tertiary)", borderTop: "1px solid var(--border-subtle)" }}>
                Showing {filtered.length} of {tasks.length} tasks · Click status, assignee, client/project, or hours to edit inline
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Task" subtitle="Add a new task to the system" size="lg">
        <TaskForm onSave={() => { setShowModal(false); reload(); }} onClose={() => setShowModal(false)} />
      </Modal>
    </>
  );
}
