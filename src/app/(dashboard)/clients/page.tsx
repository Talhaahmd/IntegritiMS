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

/* ── Field must live OUTSIDE ClientForm so React never remounts it on re-render ── */
function FormField({
  label, name, type = "text", required = false, span = 1,
  value, onChange,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  span?: number;
  value: string;
  onChange: (name: string, val: string) => void;
}) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-secondary)",
          marginBottom: 5,
          letterSpacing: "0.01em",
        }}
      >
        {label}
        {required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}
      </label>
      <input
        type={type}
        className="input-base"
        required={required}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
      />
    </div>
  );
}

function ClientForm({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", company_name: "", contact_person: "", email: "",
    phone: "", status: "active", priority: "medium", notes: "",
  });
  const [saving, setSaving] = useState(false);

  function handleChange(name: string, val: string) {
    setForm((prev) => ({ ...prev, [name]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await createClientRecord(form as Partial<Client>);
    setSaving(false);
    onSave();
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Section: Client Info ── */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
          marginBottom: 12,
        }}
      >
        Client Information
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 14px", marginBottom: 18 }}>
        <FormField label="Client Name"     name="name"           required value={form.name}           onChange={handleChange} />
        <FormField label="Company Name"    name="company_name"   required value={form.company_name}   onChange={handleChange} />
        <FormField label="Contact Person"  name="contact_person" required value={form.contact_person}  onChange={handleChange} />
        <FormField label="Email Address"   name="email" type="email" required value={form.email}      onChange={handleChange} />
        <FormField label="Phone Number"    name="phone"          span={2}  value={form.phone}          onChange={handleChange} />
      </div>

      {/* ── Section: Settings ── */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
          marginBottom: 12,
          paddingTop: 6,
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        Settings
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 14px", marginBottom: 18 }}>
        {/* Status */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: 5,
              letterSpacing: "0.01em",
            }}
          >
            Status
          </label>
          <select
            className="input-base"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
          >
            {["active", "inactive", "on hold", "churned"].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: 5,
              letterSpacing: "0.01em",
            }}
          >
            Priority
          </label>
          <select
            className="input-base"
            value={form.priority}
            onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
          >
            {["critical", "high", "medium", "low"].map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-secondary)",
            marginBottom: 5,
            letterSpacing: "0.01em",
          }}
        >
          Notes
        </label>
        <textarea
          className="input-base"
          rows={3}
          placeholder="Optional internal notes…"
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          style={{ resize: "vertical" }}
        />
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          paddingTop: 4,
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: 16,
        } as React.CSSProperties}
      >
        <button type="button" className="btn btn-secondary" onClick={onClose}
          style={{ height: 36, fontSize: 13 }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
          style={{ height: 36, fontSize: 13, minWidth: 110 }}
        >
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
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.company_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading)
    return (
      <>
        <TopBar title="Clients" />
        <PageLoader />
      </>
    );

  return (
    <>
      <TopBar title="Clients" subtitle={`${clients.length} clients total`} />

      <div style={{ padding: "24px 28px 36px" }} className="animate-fade-up">

        {/* ── Summary cards ──────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
            marginBottom: 20,
          }}
        >
          {[
            {
              label: "Total Clients",
              value: clients.length,
              color: "#4F46E5",
              bg: "#EEF2FF",
              Icon: Users,
            },
            {
              label: "Active",
              value: clients.filter((c) => c.status === "active").length,
              color: "#059669",
              bg: "#ECFDF5",
              Icon: CheckSquare,
            },
            {
              label: "Waiting for Update",
              value: clients.filter((c) => c.waiting_for_update).length,
              color: "#D97706",
              bg: "#FFFBEB",
              Icon: Bell,
            },
            {
              label: "Overdue Tasks",
              value: clients.reduce((s, c) => s + (c.overdue_tasks ?? 0), 0),
              color: "#DC2626",
              bg: "#FEF2F2",
              Icon: AlertCircle,
            },
          ].map(({ Icon, ...s }) => (
            <div
              key={s.label}
              className="card hover-lift"
              style={{
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              {/* Icon badge */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: s.bg,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={17} style={{ color: s.color }} />
              </div>

              {/* Text */}
              <div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: s.color,
                    letterSpacing: "-0.5px",
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          {/* Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <Search
                size={13}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-tertiary)",
                  pointerEvents: "none",
                }}
              />
              <input
                className="input-base"
                style={{ paddingLeft: 30, height: 36, width: 234, fontSize: 13 }}
                placeholder="Search clients…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="input-base"
              style={{ height: 36, width: 148, fontSize: 13 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              {["active", "inactive", "on hold", "churned"].map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Add Client */}
          <button
            className="btn btn-primary"
            style={{ height: 36, fontSize: 13, gap: 6 }}
            onClick={() => setShowModal(true)}
          >
            <Plus size={14} /> Add Client
          </button>
        </div>

        {/* ── Table ──────────────────────────────────────────── */}
        <div className="card-lg" style={{ overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No clients found"
              description="Add your first client to get started."
              action={
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowModal(true)}
                >
                  <Plus size={13} /> Add Client
                </button>
              }
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ minWidth: 940 }}>
                <colgroup>
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Projects</th>
                    <th>Tasks</th>
                    <th>Overdue</th>
                    <th>Next Deadline</th>
                    <th>Update</th>
                    <th>Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((client) => (
                    <tr key={client.id}>
                      {/* Client name + company */}
                      <td>
                        <Link
                          href={`/clients/${client.id}`}
                          style={{ textDecoration: "none", display: "block" }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 13.5,
                              color: "var(--text-primary)",
                              lineHeight: 1.3,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}
                            title={client.name}
                          >
                            {client.name}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              marginTop: 3,
                              fontSize: 11.5,
                              color: "var(--text-tertiary)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}
                            title={client.company_name}
                          >
                            <Building2 size={10} style={{ flexShrink: 0 }} />
                            {client.company_name}
                          </div>
                        </Link>
                      </td>

                      {/* Contact */}
                      <td>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--text-primary)",
                            lineHeight: 1.3,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                          title={client.contact_person}
                        >
                          {client.contact_person}
                        </div>
                        <div
                          style={{
                            fontSize: 11.5,
                            marginTop: 3,
                            color: "var(--text-tertiary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                          title={client.email}
                        >
                          {client.email}
                        </div>
                      </td>

                      {/* Status badge */}
                      <td>
                        <StatusBadge status={client.status} />
                      </td>

                      {/* Priority badge */}
                      <td>
                        <PriorityBadge priority={client.priority} />
                      </td>

                      {/* Projects */}
                      <td>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 13,
                            color: "var(--text-primary)",
                            fontWeight: 500,
                          }}
                        >
                          <FolderKanban
                            size={13}
                            style={{ color: "var(--text-tertiary)", flexShrink: 0 }}
                          />
                          {client.active_projects ?? 0}
                        </span>
                      </td>

                      {/* Tasks */}
                      <td>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 13,
                            color: "var(--text-primary)",
                            fontWeight: 500,
                          }}
                        >
                          <CheckSquare
                            size={13}
                            style={{ color: "var(--text-tertiary)", flexShrink: 0 }}
                          />
                          {client.total_tasks ?? 0}
                        </span>
                      </td>

                      {/* Overdue */}
                      <td>
                        {(client.overdue_tasks ?? 0) > 0 ? (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              fontSize: 13,
                              color: "#DC2626",
                              fontWeight: 600,
                            }}
                          >
                            <AlertCircle size={13} />
                            {client.overdue_tasks}
                          </span>
                        ) : (
                          <span
                            style={{ fontSize: 13, color: "var(--text-tertiary)" }}
                          >
                            —
                          </span>
                        )}
                      </td>

                      {/* Next Deadline */}
                      <td>
                        {client.next_deadline ? (
                          <span
                            style={{
                              fontSize: 12.5,
                              fontWeight: 500,
                              color: "var(--text-primary)",
                            }}
                          >
                            {formatDate(client.next_deadline, "MMM d")}
                          </span>
                        ) : (
                          <span
                            style={{ fontSize: 13, color: "var(--text-tertiary)" }}
                          >
                            —
                          </span>
                        )}
                      </td>

                      {/* Update status */}
                      <td>
                        {client.waiting_for_update ? (
                          <span
                            className="badge"
                            style={{
                              background: "#FFFBEB",
                              color: "#B45309",
                              border: "1px solid #FDE68A",
                              fontSize: 11.5,
                              fontWeight: 600,
                              gap: 4,
                            }}
                          >
                            <Bell size={10} /> Waiting
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--text-tertiary)",
                              fontWeight: 500,
                            }}
                          >
                            Up to date
                          </span>
                        )}
                      </td>

                      {/* Last Activity */}
                      <td
                        style={{
                          fontSize: 12,
                          color: "var(--text-tertiary)",
                          fontWeight: 400,
                        }}
                      >
                        {timeAgo(client.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Client"
        subtitle="Enter client details below."
      >
        <ClientForm
          onSave={() => {
            setShowModal(false);
            reload();
          }}
          onClose={() => setShowModal(false)}
        />
      </Modal>
    </>
  );
}
