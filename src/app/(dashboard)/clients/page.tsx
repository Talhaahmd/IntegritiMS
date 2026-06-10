"use client";
import { useState, useRef, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { useClients, createClientRecord, updateClientRecord } from "@/lib/hooks/useClients";
import { formatDate, timeAgo } from "@/lib/utils";
import { Users, Plus, Search, AlertCircle, Bell, FolderKanban, CheckSquare, Building2, Check } from "lucide-react";
import Link from "next/link";
import { Client } from "@/types";

/* ── Inline dropdown for status / priority ───────────────────────── */
function InlineDropdown<T extends string>({
  value, options, onSave, renderOption, renderValue,
}: {
  value: T;
  options: T[];
  onSave: (v: T) => void;
  renderOption?: (v: T) => React.ReactNode;
  renderValue?: (v: T) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "inline-flex" }}
      >
        {renderValue ? renderValue(value) : <StatusBadge status={value} />}
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
          background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)", minWidth: 140, padding: 4,
        }}>
          {options.map((opt) => (
            <button key={opt} onClick={() => { onSave(opt); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                background: opt === value ? "#F5F3FF" : "none", border: "none",
                borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 13,
              }}
            >
              {renderOption ? renderOption(opt) : <span style={{ textTransform: "capitalize" }}>{opt}</span>}
              {opt === value && <Check size={12} style={{ marginLeft: "auto", color: "#4F46E5" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Inline date cell ────────────────────────────────────────────── */
function InlineDateCell({ value, onSave }: { value: string | null; onSave: (v: string | null) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? "");
  if (editing) return (
    <input type="date" autoFocus value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => { onSave(val || null); setEditing(false); }}
      onKeyDown={(e) => { if (e.key === "Enter") { onSave(val || null); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
      style={{ fontSize: 12, border: "1px solid #4F46E5", borderRadius: 4, padding: "2px 4px", outline: "none" }}
    />
  );
  return (
    <button onClick={() => setEditing(true)}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12.5, fontWeight: 500, color: value ? "var(--text-primary)" : "var(--text-tertiary)" }}>
      {value ? formatDate(value, "MMM d") : "—"}
    </button>
  );
}

/* ── Waiting toggle ──────────────────────────────────────────────── */
function WaitingToggle({ value, onSave }: { value: boolean; onSave: (v: boolean) => void }) {
  return (
    <button onClick={() => onSave(!value)}
      style={{
        background: value ? "#FFFBEB" : "#F9FAFB",
        border: `1px solid ${value ? "#FDE68A" : "#E5E7EB"}`,
        borderRadius: 6, padding: "3px 8px", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 4,
        fontSize: 11.5, fontWeight: 600,
        color: value ? "#B45309" : "#6B7280",
        transition: "all 0.15s",
      }}>
      <Bell size={10} /> {value ? "Waiting" : "Up to date"}
    </button>
  );
}

/* ── FormField ────────────────────────────────────────────────────── */
function FormField({
  label, name, type = "text", required = false, span = 1, value, onChange,
}: {
  label: string; name: string; type?: string; required?: boolean; span?: number;
  value: string; onChange: (name: string, val: string) => void;
}) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5, letterSpacing: "0.01em" }}>
        {label}{required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}
      </label>
      <input type={type} className="input-base" required={required} placeholder={label} value={value}
        onChange={(e) => onChange(name, e.target.value)} />
    </div>
  );
}

/* ── Add Client Form ─────────────────────────────────────────────── */
function ClientForm({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", company_name: "", contact_person: "", email: "",
    phone: "", status: "active", priority: "medium", notes: "",
  });
  const [saving, setSaving] = useState(false);

  function handleChange(name: string, val: string) { setForm((p) => ({ ...p, [name]: val })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await createClientRecord(form as Partial<Client>);
    setSaving(false);
    onSave();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12 }}>Client Information</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 14px", marginBottom: 18 }}>
        <FormField label="Client Name" name="name" required value={form.name} onChange={handleChange} />
        <FormField label="Company Name" name="company_name" required value={form.company_name} onChange={handleChange} />
        <FormField label="Contact Person" name="contact_person" required value={form.contact_person} onChange={handleChange} />
        <FormField label="Email Address" name="email" type="email" required value={form.email} onChange={handleChange} />
        <FormField label="Phone Number" name="phone" span={2} value={form.phone} onChange={handleChange} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12, paddingTop: 6, borderTop: "1px solid var(--border-subtle)" }}>Settings</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 14px", marginBottom: 18 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5 }}>Status</label>
          <select className="input-base" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            {["active","inactive","on hold","churned"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5 }}>Priority</label>
          <select className="input-base" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
            {["critical","high","medium","low"].map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5 }}>Notes</label>
        <textarea className="input-base" rows={3} placeholder="Optional internal notes…" value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} style={{ resize: "vertical" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
        <button type="button" className="btn btn-secondary" onClick={onClose} style={{ height: 36, fontSize: 13 }}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ height: 36, fontSize: 13, minWidth: 110 }}>{saving ? "Saving…" : "Add Client"}</button>
      </div>
    </form>
  );
}

/* ── PRIORITY badge ─────────────────────────────────────────────── */
const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  critical: { bg: "#FEF2F2", color: "#DC2626" },
  high:     { bg: "#FFF7ED", color: "#C2410C" },
  medium:   { bg: "#FFFBEB", color: "#B45309" },
  low:      { bg: "#F0FDF4", color: "#15803D" },
};
function PriorityChip({ p }: { p: string }) {
  const c = PRIORITY_COLORS[p] ?? { bg: "#F3F4F6", color: "#374151" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", background: c.bg, color: c.color, borderRadius: 6, padding: "3px 8px", fontSize: 11.5, fontWeight: 600, textTransform: "capitalize" }}>{p}</span>
  );
}

/* ── STATUS badge ────────────────────────────────────────────────── */
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active:   { bg: "#ECFDF5", color: "#059669" },
  inactive: { bg: "#F3F4F6", color: "#6B7280" },
  "on hold":{ bg: "#FFFBEB", color: "#B45309" },
  churned:  { bg: "#FEF2F2", color: "#DC2626" },
};
function StatusChip({ s }: { s: string }) {
  const c = STATUS_COLORS[s] ?? { bg: "#F3F4F6", color: "#374151" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", background: c.bg, color: c.color, borderRadius: 6, padding: "3px 8px", fontSize: 11.5, fontWeight: 600, textTransform: "capitalize" }}>{s}</span>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function ClientsPage() {
  const { data: clients, loading, reload } = useClients();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  async function patch(id: string, values: Partial<Client>) {
    await updateClientRecord(id, values);
    reload();
  }

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.company_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return (<><TopBar title="Clients" /><PageLoader /></>);

  return (
    <>
      <TopBar title="Clients" subtitle={`${clients.length} clients total`} />
      <div style={{ padding: "24px 28px 36px" }} className="animate-fade-up">

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Total Clients",      value: clients.length,                                    color: "#4F46E5", bg: "#EEF2FF",  Icon: Users       },
            { label: "Active",             value: clients.filter((c) => c.status === "active").length, color: "#059669", bg: "#ECFDF5", Icon: CheckSquare },
            { label: "Waiting for Update", value: clients.filter((c) => c.waiting_for_update).length,  color: "#D97706", bg: "#FFFBEB", Icon: Bell        },
            { label: "Overdue Tasks",      value: clients.reduce((s, c) => s + (c.overdue_tasks ?? 0), 0), color: "#DC2626", bg: "#FEF2F2", Icon: AlertCircle },
          ].map(({ Icon, ...s }) => (
            <div key={s.label} className="card hover-lift" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={17} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: s.color, letterSpacing: "-0.5px" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
              <input className="input-base" style={{ paddingLeft: 30, height: 36, width: 234, fontSize: 13 }} placeholder="Search clients…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="input-base" style={{ height: 36, width: 148, fontSize: 13 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              {["active","inactive","on hold","churned"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" style={{ height: 36, fontSize: 13, gap: 6 }} onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Client
          </button>
        </div>

        {/* Table */}
        <div className="card-lg" style={{ overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <EmptyState icon={Users} title="No clients found" description="Add your first client to get started."
              action={<button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={13} /> Add Client</button>} />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ minWidth: 980 }}>
                <colgroup>
                  <col style={{ width: "16%" }} /><col style={{ width: "15%" }} />
                  <col style={{ width: "11%" }} /><col style={{ width: "10%" }} />
                  <col style={{ width: "6%" }} /><col style={{ width: "6%" }} />
                  <col style={{ width: "6%" }} /><col style={{ width: "11%" }} />
                  <col style={{ width: "11%" }} /><col style={{ width: "8%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Client</th><th>Contact</th><th>Status</th><th>Priority</th>
                    <th>Projects</th><th>Tasks</th><th>Overdue</th>
                    <th>Next Deadline</th><th>Update</th><th>Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((client) => (
                    <tr key={client.id}>
                      {/* Client name */}
                      <td>
                        <Link href={`/clients/${client.id}`} style={{ textDecoration: "none", display: "block" }}>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={client.name}>{client.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, fontSize: 11.5, color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={client.company_name}>
                            <Building2 size={10} style={{ flexShrink: 0 }} />{client.company_name}
                          </div>
                        </Link>
                      </td>
                      {/* Contact */}
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{client.contact_person}</div>
                        <div style={{ fontSize: 11.5, marginTop: 3, color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{client.email}</div>
                      </td>
                      {/* Status — inline dropdown */}
                      <td>
                        <InlineDropdown
                          value={client.status}
                          options={["active","inactive","on hold","churned"] as Client["status"][]}
                          onSave={(v) => patch(client.id, { status: v })}
                          renderValue={(v) => <StatusChip s={v} />}
                          renderOption={(v) => <StatusChip s={v} />}
                        />
                      </td>
                      {/* Priority — inline dropdown */}
                      <td>
                        <InlineDropdown
                          value={client.priority}
                          options={["critical","high","medium","low"] as Client["priority"][]}
                          onSave={(v) => patch(client.id, { priority: v })}
                          renderValue={(v) => <PriorityChip p={v} />}
                          renderOption={(v) => <PriorityChip p={v} />}
                        />
                      </td>
                      {/* Projects */}
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                          <FolderKanban size={13} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />{client.active_projects ?? 0}
                        </span>
                      </td>
                      {/* Tasks */}
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                          <CheckSquare size={13} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />{client.total_tasks ?? 0}
                        </span>
                      </td>
                      {/* Overdue */}
                      <td>
                        {(client.overdue_tasks ?? 0) > 0 ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#DC2626", fontWeight: 600 }}>
                            <AlertCircle size={13} />{client.overdue_tasks}
                          </span>
                        ) : <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>—</span>}
                      </td>
                      {/* Next Deadline — inline date */}
                      <td>
                        <InlineDateCell value={client.next_deadline} onSave={(v) => patch(client.id, { next_deadline: v })} />
                      </td>
                      {/* Waiting toggle */}
                      <td>
                        <WaitingToggle value={client.waiting_for_update} onSave={(v) => patch(client.id, { waiting_for_update: v })} />
                      </td>
                      {/* Last activity */}
                      <td style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 400 }}>{timeAgo(client.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Client" subtitle="Enter client details below.">
        <ClientForm onSave={() => { setShowModal(false); reload(); }} onClose={() => setShowModal(false)} />
      </Modal>
    </>
  );
}
