"use client";
import { useState, useRef, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import ProgressBar from "@/components/ui/ProgressBar";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { useProjects, createProjectRecord, updateProjectRecord } from "@/lib/hooks/useProjects";
import { useClients } from "@/lib/hooks/useClients";
import { formatDate, timeAgo } from "@/lib/utils";
import { FolderKanban, Plus, Search, Clock, Building2, Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Project, PROJECT_STATUSES } from "@/types";

/* ── Badge helpers ─────────────────────────────────────────────── */
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  "not started": { bg: "#F3F4F6", color: "#6B7280" },
  active:        { bg: "#ECFDF5", color: "#059669" },
  "in progress": { bg: "#EFF6FF", color: "#2563EB" },
  "on hold":     { bg: "#FFFBEB", color: "#B45309" },
  completed:     { bg: "#F0FDF4", color: "#16A34A" },
  delayed:       { bg: "#FEF2F2", color: "#DC2626" },
  cancelled:     { bg: "#F3F4F6", color: "#9CA3AF" },
};
const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  critical: { bg: "#FEF2F2", color: "#DC2626" },
  high:     { bg: "#FFF7ED", color: "#C2410C" },
  medium:   { bg: "#FFFBEB", color: "#B45309" },
  low:      { bg: "#F0FDF4", color: "#15803D" },
};
const HEALTH_COLORS: Record<string, { bg: string; color: string }> = {
  healthy:  { bg: "#ECFDF5", color: "#059669" },
  "at risk":{ bg: "#FFFBEB", color: "#B45309" },
  critical: { bg: "#FEF2F2", color: "#DC2626" },
};
function Chip({ label, bg, color }: { label: string; bg: string; color: string }) {
  return <span style={{ display: "inline-flex", alignItems: "center", background: bg, color, borderRadius: 6, padding: "3px 8px", fontSize: 11.5, fontWeight: 600, textTransform: "capitalize" }}>{label}</span>;
}

/* ── InlineDropdown ────────────────────────────────────────────── */
function InlineDropdown<T extends string>({
  value, options, onSave, colorMap,
}: {
  value: T; options: T[]; onSave: (v: T) => void;
  colorMap: Record<string, { bg: string; color: string }>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const c = colorMap[value] ?? { bg: "#F3F4F6", color: "#374151" };
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen((o) => !o)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: 3 }}>
        <Chip label={value} bg={c.bg} color={c.color} />
        <ChevronDown size={10} style={{ color: "#9CA3AF" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.10)", minWidth: 150, padding: 4 }}>
          {options.map((opt) => {
            const oc = colorMap[opt] ?? { bg: "#F3F4F6", color: "#374151" };
            return (
              <button key={opt} onClick={() => { onSave(opt); setOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: opt === value ? "#F5F3FF" : "none", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
                <Chip label={opt} bg={oc.bg} color={oc.color} />
                {opt === value && <Check size={12} style={{ marginLeft: "auto", color: "#4F46E5" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Searchable client dropdown ────────────────────────────────── */
function ClientDropdown({
  value, onSave, clients,
}: {
  value: string | undefined; onSave: (id: string, name: string) => void;
  clients: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const filtered = clients.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => { setOpen((o) => !o); setQ(""); }}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
        <Building2 size={11} style={{ color: "var(--text-tertiary)" }} />
        <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value ?? "—"}</span>
        <ChevronDown size={10} style={{ color: "#9CA3AF" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.10)", minWidth: 200, padding: 4 }}>
          <div style={{ padding: "4px 6px 6px" }}>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
              style={{ width: "100%", fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 6, padding: "4px 8px", outline: "none" }} />
          </div>
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? <div style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "6px 10px" }}>No results</div> : filtered.map((c) => (
              <button key={c.id} onClick={() => { onSave(c.id, c.name); setOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", background: "none", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 13, color: "var(--text-primary)" }}>
                <Building2 size={11} style={{ color: "var(--text-tertiary)" }} />{c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Form field ────────────────────────────────────────────────── */
const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5, letterSpacing: "0.01em" };
function ProjField({ label, name, type = "text", required = false, value, onChange }: {
  label: string; name: string; type?: string; required?: boolean;
  value: string | number; onChange: (name: string, val: string) => void;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}{required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}</label>
      <input type={type} className="input-base" required={required} placeholder={label} value={value as string} onChange={(e) => onChange(name, e.target.value)} />
    </div>
  );
}

function ProjectForm({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const { data: clients } = useClients();
  const [form, setForm] = useState({ name: "", client_id: "", description: "", category: "", status: "not started", priority: "medium", start_date: "", due_date: "", estimated_hours: 0, progress_percent: 0, health_status: "healthy", notes: "" });
  const [saving, setSaving] = useState(false);
  function handleChange(name: string, val: string) { setForm((p) => ({ ...p, [name]: ["estimated_hours","progress_percent"].includes(name) ? Number(val) : val })); }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await createProjectRecord(form as Partial<Project>);
    setSaving(false); onSave();
  }
  return (
    <form onSubmit={handleSubmit}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12 }}>Project Information</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 14px", marginBottom: 18 }}>
        <ProjField label="Project Name" name="name" required value={form.name} onChange={handleChange} />
        <div>
          <label style={labelStyle}>Client <span style={{ color: "#EF4444" }}>*</span></label>
          <select className="input-base" required value={form.client_id} onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value }))}>
            <option value="">Select client…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <ProjField label="Category" name="category" value={form.category} onChange={handleChange} />
        <ProjField label="Estimated Hours" name="estimated_hours" type="number" value={form.estimated_hours} onChange={handleChange} />
        <ProjField label="Start Date" name="start_date" type="date" value={form.start_date} onChange={handleChange} />
        <ProjField label="Due Date" name="due_date" type="date" value={form.due_date} onChange={handleChange} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12, paddingTop: 6, borderTop: "1px solid var(--border-subtle)" }}>Settings</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 14px", marginBottom: 18 }}>
        <div>
          <label style={labelStyle}>Status</label>
          <select className="input-base" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Priority</label>
          <select className="input-base" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
            {["critical","high","medium","low"].map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Description</label>
        <textarea className="input-base" rows={3} placeholder="Optional project description…" value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} style={{ resize: "vertical" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
        <button type="button" className="btn btn-secondary" onClick={onClose} style={{ height: 36, fontSize: 13 }}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ height: 36, fontSize: 13, minWidth: 130 }}>{saving ? "Saving…" : "Create Project"}</button>
      </div>
    </form>
  );
}

function StatPill({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className="card" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><FolderKanban size={16} style={{ color }} /></div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color, letterSpacing: "-0.5px" }}>{value}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { data: projects, loading, reload } = useProjects();
  const { data: clients } = useClients();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  async function patch(id: string, values: Partial<Project>) {
    await updateProjectRecord(id, values);
    reload();
  }

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.client as { name: string } | undefined)?.name?.toLowerCase().includes(q) || false;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return (<><TopBar title="Projects" /><PageLoader /></>);

  return (
    <>
      <TopBar title="Projects" subtitle={`${projects.length} total projects`} />
      <div style={{ padding: "24px 28px 36px" }} className="animate-fade-in">

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 20 }}>
          <StatPill label="Total"     value={projects.length}                                                           color="#4F46E5" bg="#EEF2FF" />
          <StatPill label="Active"    value={projects.filter((p) => ["active","in progress"].includes(p.status)).length} color="#059669" bg="#ECFDF5" />
          <StatPill label="Completed" value={projects.filter((p) => p.status === "completed").length}                   color="#0EA5E9" bg="#F0F9FF" />
          <StatPill label="Delayed"   value={projects.filter((p) => p.status === "delayed").length}                     color="#DC2626" bg="#FEF2F2" />
          <StatPill label="On Hold"   value={projects.filter((p) => p.status === "on hold").length}                     color="#D97706" bg="#FFFBEB" />
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
              <input className="input-base" style={{ paddingLeft: 30, height: 36, width: 234, fontSize: 13 }} placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="input-base" style={{ height: 36, width: 160, fontSize: 13 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" style={{ height: 36, fontSize: 13, gap: 6 }} onClick={() => setShowModal(true)}>
            <Plus size={14} /> New Project
          </button>
        </div>

        {/* Table */}
        <div className="card-lg" style={{ overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <EmptyState icon={FolderKanban} title="No projects found" description="Create your first project to get started."
              action={<button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={13} /> New Project</button>} />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ minWidth: 980 }}>
                <colgroup>
                  <col style={{ width: "19%" }} /><col style={{ width: "14%" }} />
                  <col style={{ width: "12%" }} /><col style={{ width: "10%" }} />
                  <col style={{ width: "9%" }} /><col style={{ width: "14%" }} />
                  <col style={{ width: "9%" }} /><col style={{ width: "8%" }} /><col style={{ width: "5%" }} />
                </colgroup>
                <thead>
                  <tr><th>Project</th><th>Client</th><th>Status</th><th>Priority</th><th>Health</th><th>Progress</th><th>Hours</th><th>Due Date</th><th>Updated</th></tr>
                </thead>
                <tbody>
                  {filtered.map((project) => {
                    const clientName = (project.client as { name: string } | undefined)?.name;
                    return (
                      <tr key={project.id}>
                        {/* Project name */}
                        <td>
                          <Link href={`/projects/${project.id}`} style={{ textDecoration: "none", display: "block" }}>
                            <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.3 }}>{project.name}</div>
                            {project.category && <div style={{ fontSize: 11.5, marginTop: 3, color: "var(--text-tertiary)" }}>{project.category}</div>}
                          </Link>
                        </td>
                        {/* Client — searchable dropdown */}
                        <td>
                          <ClientDropdown
                            value={clientName}
                            clients={clients.map((c) => ({ id: c.id, name: c.name }))}
                            onSave={(id) => patch(project.id, { client_id: id })}
                          />
                        </td>
                        {/* Status */}
                        <td>
                          <InlineDropdown
                            value={project.status}
                            options={PROJECT_STATUSES}
                            colorMap={STATUS_COLORS}
                            onSave={(v) => patch(project.id, { status: v })}
                          />
                        </td>
                        {/* Priority */}
                        <td>
                          <InlineDropdown
                            value={project.priority}
                            options={["critical","high","medium","low"] as Project["priority"][]}
                            colorMap={PRIORITY_COLORS}
                            onSave={(v) => patch(project.id, { priority: v })}
                          />
                        </td>
                        {/* Health */}
                        <td>
                          <InlineDropdown
                            value={project.health_status}
                            options={["healthy","at risk","critical"] as Project["health_status"][]}
                            colorMap={HEALTH_COLORS}
                            onSave={(v) => patch(project.id, { health_status: v })}
                          />
                        </td>
                        {/* Progress */}
                        <td><ProgressBar value={project.progress_percent} showLabel /></td>
                        {/* Hours — auto-sum from tasks (read-only) */}
                        <td>
                          <div style={{ fontSize: 13, lineHeight: 1.3 }}>
                            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{project.actual_hours}h</span>
                            <span style={{ color: "var(--text-tertiary)" }}> / {project.estimated_hours}h</span>
                          </div>
                        </td>
                        {/* Due Date */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "var(--text-primary)", fontWeight: 500 }}>
                            <Clock size={11} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                            {project.due_date ? formatDate(project.due_date) : "—"}
                          </div>
                        </td>
                        {/* Updated */}
                        <td style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 400 }}>{timeAgo(project.updated_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Project" subtitle="Fill in the details to create a new project." size="lg">
        <ProjectForm onSave={() => { setShowModal(false); reload(); }} onClose={() => setShowModal(false)} />
      </Modal>
    </>
  );
}
