"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { StatusBadge, PriorityBadge, HealthBadge } from "@/components/ui/StatusBadge";
import ProgressBar from "@/components/ui/ProgressBar";
import Modal from "@/components/ui/Modal";
import {
  useClient, useClientProjects, useClientActivity, useClientNotes,
  updateClientRecord, deleteClientRecord
} from "@/lib/hooks/useClients";
import { formatDate, timeAgo, calcProgress } from "@/lib/utils";
import {
  Building2, Mail, Phone, User, Calendar, ArrowLeft, CheckSquare,
  FolderKanban, Clock, Bell, AlertCircle, Plus, Trash2, Edit3, Activity
} from "lucide-react";
import Link from "next/link";
import { createClient as createSBClient } from "@/lib/supabase/client";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: client, loading } = useClient(id);
  const { data: projects } = useClientProjects(id);
  const { data: activity } = useClientActivity(id);
  const { data: notes, reload: reloadNotes } = useClientNotes(id);
  const [activeTab, setActiveTab] = useState<"projects" | "activity" | "notes">("projects");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  async function addNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    await createSBClient().from("notes").insert({ entity_type: "client", entity_id: id, content: noteText });
    setNoteText("");
    reloadNotes();
    setSavingNote(false);
  }

  async function handleDelete() {
    await deleteClientRecord(id);
    router.push("/clients");
  }

  if (loading || !client) return (
    <>
      <TopBar title="Client Detail" />
      <PageLoader />
    </>
  );

  const totalProjects = projects.length;
  const activeProjects = (projects as Record<string, unknown>[]).filter((p) => ["active", "in progress"].includes(p.status as string)).length;
  const completedProjects = (projects as Record<string, unknown>[]).filter((p) => p.status === "completed").length;
  const delayedProjects = (projects as Record<string, unknown>[]).filter((p) => p.status === "delayed").length;

  const TABS = ["projects", "activity", "notes"] as const;

  /* ── avatar colour seeded from name ── */
  const avatarBg = "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)";

  return (
    <>
      <TopBar title={client.name} subtitle={client.company_name} />

      <div style={{ padding: "24px 28px 36px" }} className="animate-fade-in">

        {/* ── Back link ── */}
        <Link
          href="/clients"
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: 20, marginLeft: -4, display: "inline-flex" }}
        >
          <ArrowLeft size={13} /> Back to Clients
        </Link>

        {/* ══════════ Client Header Card ══════════ */}
        <div
          className="card-lg"
          style={{ padding: "24px 26px", marginBottom: 18 }}
        >
          {/* Top row: avatar + name + actions */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
              {/* Avatar */}
              <div
                style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: avatarBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 800, fontSize: 22,
                  flexShrink: 0,
                  boxShadow: "0 4px 14px rgba(99,102,241,0.30)",
                }}
              >
                {client.name.charAt(0).toUpperCase()}
              </div>

              {/* Name block */}
              <div>
                <h2
                  style={{
                    fontSize: 22, fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.5px",
                    lineHeight: 1.2,
                  }}
                >
                  {client.name}
                </h2>
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    marginTop: 5, color: "var(--text-secondary)", fontSize: 13,
                  }}
                >
                  <Building2 size={12} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                  {client.company_name}
                </div>

                {/* Badges */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                  <StatusBadge status={client.status} />
                  <PriorityBadge priority={client.priority} />
                  {client.waiting_for_update && (
                    <span
                      className="badge"
                      style={{
                        background: "#FFFBEB", color: "#B45309",
                        border: "1px solid #FDE68A", fontSize: 11.5, fontWeight: 600, gap: 4,
                      }}
                    >
                      <Bell size={10} /> Waiting for update
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ gap: 6, height: 34, fontSize: 12.5 }}
              >
                <Edit3 size={12} /> Edit
              </button>
              <button
                className="btn btn-danger btn-sm"
                style={{ width: 34, height: 34, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => setShowDelete(true)}
                title="Delete client"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* ── Contact info strip ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 0,
              marginTop: 22,
              paddingTop: 20,
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            {[
              { icon: User, label: "Contact", value: client.contact_person },
              { icon: Mail, label: "Email", value: client.email },
              { icon: Phone, label: "Phone", value: client.phone || "—" },
              { icon: Calendar, label: "Next Deadline", value: client.next_deadline ? formatDate(client.next_deadline) : "—" },
            ].map(({ icon: Icon, label, value }, i, arr) => (
              <div
                key={label}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  paddingLeft: i === 0 ? 0 : 20,
                  borderLeft: i === 0 ? "none" : "1px solid var(--border-subtle)",
                }}
              >
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={13} style={{ color: "var(--text-tertiary)" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginTop: 3, lineHeight: 1.2 }}>
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════ Summary stat row ══════════ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 12,
            marginBottom: 18,
          }}
        >
          {[
            { label: "Total Projects", value: totalProjects,                   icon: FolderKanban, color: "#4F46E5", bg: "#EEF2FF" },
            { label: "Active",         value: activeProjects,                  icon: Activity,     color: "#059669", bg: "#ECFDF5" },
            { label: "Completed",      value: completedProjects,               icon: CheckSquare,  color: "#0EA5E9", bg: "#F0F9FF" },
            { label: "Delayed",        value: delayedProjects,                 icon: AlertCircle,  color: "#DC2626", bg: "#FEF2F2" },
            { label: "Overdue Tasks",  value: client.overdue_tasks ?? 0,       icon: Clock,        color: "#DC2626", bg: "#FEF2F2" },
            { label: "Created",        value: formatDate(client.created_at, "MMM yyyy"), icon: Calendar, color: "#7C3AED", bg: "#F5F3FF" },
          ].map((s) => (
            <div
              key={s.label}
              className="card"
              style={{ padding: "14px 16px" }}
            >
              <div
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: s.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                <s.icon size={13} style={{ color: s.color }} />
              </div>
              <div
                style={{
                  fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px",
                  color: s.color, lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 11.5, marginTop: 4,
                  color: "var(--text-secondary)", fontWeight: 500,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ══════════ Tabs Card ══════════ */}
        <div className="card-lg" style={{ overflow: "hidden" }}>
          {/* Tab bar */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border)",
              padding: "0 24px",
              background: "var(--surface)",
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "13px 16px",
                  fontSize: 13,
                  fontWeight: activeTab === tab ? 600 : 500,
                  color: activeTab === tab ? "var(--accent)" : "var(--text-secondary)",
                  background: "none",
                  border: "none",
                  borderBottom: `2px solid ${activeTab === tab ? "var(--accent)" : "transparent"}`,
                  cursor: "pointer",
                  transition: "color 0.15s",
                  textTransform: "capitalize",
                  whiteSpace: "nowrap",
                } as React.CSSProperties}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab body */}
          <div style={{ padding: "22px 24px" }}>

            {/* ── Projects ── */}
            {activeTab === "projects" && (
              <div>
                <div
                  style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", marginBottom: 16,
                  }}
                >
                  <div
                    style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}
                  >
                    Projects
                  </div>
                  <Link href={`/projects?client=${id}`} className="btn btn-secondary btn-sm" style={{ height: 32, fontSize: 12.5, gap: 5 }}>
                    <Plus size={12} /> New Project
                  </Link>
                </div>

                {projects.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--text-tertiary)", padding: "24px 0", textAlign: "center" }}>
                    No projects yet.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {(projects as Record<string, unknown>[]).map((p) => (
                      <Link
                        key={p.id as string}
                        href={`/projects/${p.id}`}
                        style={{
                          display: "block",
                          padding: "16px 18px",
                          borderRadius: 12,
                          border: "1px solid var(--border)",
                          background: "#fff",
                          textDecoration: "none",
                          transition: "border-color 0.15s, box-shadow 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = "#C7D2FE";
                          (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(79,70,229,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                          (e.currentTarget as HTMLElement).style.boxShadow = "none";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", lineHeight: 1.3 }}>
                              {p.name as string}
                            </div>
                            <div style={{ fontSize: 12.5, marginTop: 3, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                              {(p.description as string) || "No description"}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                              <StatusBadge status={p.status as string} />
                              <PriorityBadge priority={p.priority as string} />
                              <HealthBadge health={p.health_status as string} />
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                              {p.progress_percent as number}%
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 2 }}>
                              Due {p.due_date ? formatDate(p.due_date as string) : "—"}
                            </div>
                          </div>
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <ProgressBar value={p.progress_percent as number} showLabel={false} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Activity ── */}
            {activeTab === "activity" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {activity.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--text-tertiary)", padding: "24px 0", textAlign: "center" }}>
                    No activity yet.
                  </div>
                ) : (
                  activity.map((log, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: "var(--accent-light)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Activity size={13} style={{ color: "var(--accent)" }} />
                      </div>
                      <div style={{ paddingTop: 6 }}>
                        <div style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.4 }}>
                          {log.description as string}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 3 }}>
                          {timeAgo(log.created_at as string)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Notes ── */}
            {activeTab === "notes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Compose */}
                <div
                  style={{
                    display: "flex", gap: 10, alignItems: "flex-end",
                    padding: "14px 16px",
                    borderRadius: 10,
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <textarea
                    className="input-base"
                    rows={2}
                    placeholder="Add an internal note…"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    style={{ flex: 1, resize: "none", background: "#fff" }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={addNote}
                    disabled={savingNote || !noteText.trim()}
                    style={{ height: 36, fontSize: 13, flexShrink: 0 }}
                  >
                    {savingNote ? "…" : "Add"}
                  </button>
                </div>

                {notes.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--text-tertiary)", padding: "16px 0", textAlign: "center" }}>
                    No notes yet.
                  </div>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        padding: "14px 16px",
                        borderRadius: 10,
                        background: "#FFFBEB",
                        border: "1px solid #FEF3C7",
                      }}
                    >
                      <p style={{ fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.5 }}>
                        {note.content}
                      </p>
                      <div style={{ fontSize: 11.5, marginTop: 8, color: "#B45309", fontWeight: 500 }}>
                        {timeAgo(note.created_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Delete Confirm Modal ── */}
      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Client?"
        subtitle="This will permanently delete the client and all associated data."
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" style={{ height: 36, fontSize: 13 }} onClick={() => setShowDelete(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" style={{ height: 36, fontSize: 13 }} onClick={handleDelete}>
              Delete Client
            </button>
          </>
        }
      >
        <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Are you sure you want to delete <strong style={{ color: "var(--text-primary)" }}>{client.name}</strong>?{" "}
          This action cannot be undone and all projects, tasks, and notes linked to this client will be permanently removed.
        </p>
      </Modal>
    </>
  );
}
