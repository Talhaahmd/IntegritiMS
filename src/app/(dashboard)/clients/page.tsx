"use client";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { useClients, createClientRecord } from "@/lib/hooks/useClients";
import { formatDate, timeAgo } from "@/lib/utils";
import { Users, Plus, Search, AlertCircle, Bell, FolderKanban, CheckSquare, Building2 } from "lucide-react";
import Link from "next/link";
import { Client } from "@/types";

function ClientForm({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", company_name: "", contact_person: "", email: "",
    phone: "", status: "active", priority: "medium", notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await createClientRecord(form as Partial<Client>);
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
        value={(form as Record<string, string>)[name]}
        onChange={(e) => setForm((prev) => ({ ...prev, [name]: e.target.value }))}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <F label="Client Name" name="name" required />
        <F label="Company Name" name="company_name" required />
        <F label="Contact Person" name="contact_person" required />
        <F label="Email" name="email" type="email" required />
        <F label="Phone" name="phone" />
        <div>
          <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Status</label>
          <select className="input-base" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            {["active", "inactive", "on hold", "churned"].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Priority</label>
          <select className="input-base" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
            {["critical", "high", "medium", "low"].map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Notes</label>
        <textarea
          className="input-base"
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Add Client"}
        </button>
      </div>
    </form>
  );
}

export default function ClientsPage() {
  const { data: clients, loading, reload } = useClients();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.company_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return (
    <>
      <TopBar title="Clients" />
      <PageLoader />
    </>
  );

  return (
    <>
      <TopBar title="Clients" subtitle={`${clients.length} clients total`} />

      <div className="p-8 animate-fade-in">
        {/* Header actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
              <input
                className="input-base pl-9 h-9 w-64"
                placeholder="Search clients…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input-base h-9 w-40"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              {["active", "inactive", "on hold", "churned"].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Client
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Clients", value: clients.length, color: "#6366F1", bg: "#EEF2FF", Icon: Users },
            { label: "Active", value: clients.filter((c) => c.status === "active").length, color: "#10B981", bg: "#ECFDF5", Icon: CheckSquare },
            { label: "Waiting for Update", value: clients.filter((c) => c.waiting_for_update).length, color: "#F59E0B", bg: "#FFFBEB", Icon: Bell },
            { label: "Overdue Tasks", value: clients.reduce((s, c) => s + (c.overdue_tasks ?? 0), 0), color: "#EF4444", bg: "#FEF2F2", Icon: AlertCircle },
          ].map(({ Icon, ...s }) => (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                <Icon size={16} style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-[22px] font-semibold tracking-tight" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[12px] text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card-lg overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={Users} title="No clients found" description="Add your first client to get started." action={
              <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={13} />Add Client</button>
            } />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Projects</th>
                  <th>Tasks</th>
                  <th>Overdue</th>
                  <th>Deadline Health</th>
                  <th>Update</th>
                  <th>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <Link href={`/clients/${client.id}`} className="block hover:underline">
                        <div className="font-medium text-[13.5px]">{client.name}</div>
                        <div className="text-[12px] flex items-center gap-1 mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                          <Building2 size={11} />{client.company_name}
                        </div>
                      </Link>
                    </td>
                    <td>
                      <div className="text-[13px]">{client.contact_person}</div>
                      <div className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{client.email}</div>
                    </td>
                    <td><StatusBadge status={client.status} /></td>
                    <td><PriorityBadge priority={client.priority} /></td>
                    <td>
                      <span className="flex items-center gap-1.5 text-[13px]">
                        <FolderKanban size={13} style={{ color: "var(--text-tertiary)" }} />
                        {client.active_projects ?? 0}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 text-[13px]">
                        <CheckSquare size={13} style={{ color: "var(--text-tertiary)" }} />
                        {client.total_tasks ?? 0}
                      </span>
                    </td>
                    <td>
                      {(client.overdue_tasks ?? 0) > 0 ? (
                        <span className="flex items-center gap-1.5 text-red-600 text-[13px] font-medium">
                          <AlertCircle size={13} />{client.overdue_tasks}
                        </span>
                      ) : (
                        <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>—</span>
                      )}
                    </td>
                    <td>
                      {client.next_deadline ? (
                        <span className="text-[12.5px]">{formatDate(client.next_deadline, "MMM d")}</span>
                      ) : (
                        <span style={{ color: "var(--text-tertiary)" }}>—</span>
                      )}
                    </td>
                    <td>
                      {client.waiting_for_update ? (
                        <span className="flex items-center gap-1.5 badge bg-amber-50 text-amber-700">
                          <Bell size={11} /> Waiting
                        </span>
                      ) : (
                        <span className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>Up to date</span>
                      )}
                    </td>
                    <td className="text-[12.5px]" style={{ color: "var(--text-tertiary)" }}>
                      {timeAgo(client.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Client"
        subtitle="Enter client details below."
      >
        <ClientForm onSave={() => { setShowModal(false); reload(); }} onClose={() => setShowModal(false)} />
      </Modal>
    </>
  );
}
