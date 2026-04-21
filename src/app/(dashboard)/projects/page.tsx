"use client";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { StatusBadge, PriorityBadge, HealthBadge } from "@/components/ui/StatusBadge";
import ProgressBar from "@/components/ui/ProgressBar";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { useProjects, createProjectRecord } from "@/lib/hooks/useProjects";
import { useClients } from "@/lib/hooks/useClients";
import { formatDate, timeAgo } from "@/lib/utils";
import { FolderKanban, Plus, Search, Clock, Building2 } from "lucide-react";
import Link from "next/link";
import { Project, PROJECT_STATUSES } from "@/types";

function ProjectForm({ onSave, onClose, defaultClientId }: { onSave: () => void; onClose: () => void; defaultClientId?: string }) {
  const { data: clients } = useClients();
  const [form, setForm] = useState({
    name: "", client_id: defaultClientId ?? "", description: "", category: "",
    status: "not started", priority: "medium",
    start_date: "", due_date: "",
    estimated_hours: 0, progress_percent: 0,
    health_status: "healthy",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await createProjectRecord(form as Partial<Project>);
    setSaving(false);
    onSave();
  }

  const F = ({ label, name, type = "text", required = false }: { label: string; name: string; type?: string; required?: boolean }) => (
    <div>
      <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</label>
      <input
        type={type}
        className="input-base"
        required={required}
        value={(form as Record<string, string | number>)[name] as string}
        onChange={(e) => setForm((p) => ({ ...p, [name]: type === "number" ? Number(e.target.value) : e.target.value }))}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <F label="Project Name" name="name" required />
        <div>
          <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Client *</label>
          <select className="input-base" required value={form.client_id} onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value }))}>
            <option value="">Select client…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Status</label>
          <select className="input-base" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Priority</label>
          <select className="input-base" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
            {["critical", "high", "medium", "low"].map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
        <F label="Start Date" name="start_date" type="date" />
        <F label="Due Date" name="due_date" type="date" />
        <F label="Estimated Hours" name="estimated_hours" type="number" />
        <div>
          <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Category</label>
          <input className="input-base" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. Custom Development" />
        </div>
      </div>
      <div>
        <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Description</label>
        <textarea className="input-base" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Create Project"}</button>
      </div>
    </form>
  );
}

export default function ProjectsPage() {
  const { data: projects, loading, reload } = useProjects();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.client as { name: string } | undefined)?.name?.toLowerCase().includes(q) || false;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return (
    <>
      <TopBar title="Projects" />
      <PageLoader />
    </>
  );

  return (
    <>
      <TopBar title="Projects" subtitle={`${projects.length} total projects`} />

      <div className="p-8 animate-fade-in">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
              <input className="input-base pl-9 h-9 w-64" placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="input-base h-9 w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> New Project</button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total", value: projects.length, color: "#6366F1", bg: "#EEF2FF" },
            { label: "Active", value: projects.filter((p) => ["active", "in progress"].includes(p.status)).length, color: "#10B981", bg: "#ECFDF5" },
            { label: "Completed", value: projects.filter((p) => p.status === "completed").length, color: "#0EA5E9", bg: "#F0F9FF" },
            { label: "Delayed", value: projects.filter((p) => p.status === "delayed").length, color: "#EF4444", bg: "#FEF2F2" },
            { label: "On Hold", value: projects.filter((p) => p.status === "on hold").length, color: "#F59E0B", bg: "#FFFBEB" },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="w-8 h-8 rounded-xl mb-3 flex items-center justify-center" style={{ background: s.bg }}>
                <FolderKanban size={14} style={{ color: s.color }} />
              </div>
              <div className="text-[22px] font-semibold tracking-tight" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[12px] mt-0.5 text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card-lg overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={FolderKanban} title="No projects found" description="Create your first project to get started." action={
              <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={13} />New Project</button>
            } />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Health</th>
                  <th>Progress</th>
                  <th>Hours</th>
                  <th>Due Date</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <Link href={`/projects/${project.id}`} className="block hover:underline">
                        <div className="font-medium">{project.name}</div>
                        {project.category && (
                          <div className="text-[11.5px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{project.category}</div>
                        )}
                      </Link>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-[13px]">
                        <Building2 size={12} style={{ color: "var(--text-tertiary)" }} />
                        {(project.client as { name: string } | undefined)?.name ?? "—"}
                      </div>
                    </td>
                    <td><StatusBadge status={project.status} /></td>
                    <td><PriorityBadge priority={project.priority} /></td>
                    <td><HealthBadge health={project.health_status} /></td>
                    <td style={{ minWidth: 140 }}>
                      <ProgressBar value={project.progress_percent} showLabel />
                    </td>
                    <td>
                      <div className="text-[13px]">
                        <span className="font-medium">{project.actual_hours}h</span>
                        <span style={{ color: "var(--text-tertiary)" }}> / {project.estimated_hours}h</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-[12.5px]">
                        <Clock size={12} style={{ color: "var(--text-tertiary)" }} />
                        {project.due_date ? formatDate(project.due_date) : "—"}
                      </div>
                    </td>
                    <td className="text-[12.5px]" style={{ color: "var(--text-tertiary)" }}>
                      {timeAgo(project.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Project" size="lg">
        <ProjectForm onSave={() => { setShowModal(false); reload(); }} onClose={() => setShowModal(false)} />
      </Modal>
    </>
  );
}
