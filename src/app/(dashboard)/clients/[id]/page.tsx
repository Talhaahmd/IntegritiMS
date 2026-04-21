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

  return (
    <>
      <TopBar title={client.name} subtitle={client.company_name} />

      <div className="p-8 animate-fade-in">
        {/* Back */}
        <Link href="/clients" className="btn btn-ghost btn-sm mb-6 -ml-2">
          <ArrowLeft size={14} /> Back to Clients
        </Link>

        {/* Client Header Card */}
        <div className="card-lg p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-5">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
              >
                {client.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-[22px] font-semibold tracking-tight text-gray-900">{client.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 size={13} style={{ color: "var(--text-tertiary)" }} />
                  <span className="text-[13.5px]" style={{ color: "var(--text-secondary)" }}>{client.company_name}</span>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <StatusBadge status={client.status} />
                  <PriorityBadge priority={client.priority} />
                  {client.waiting_for_update && (
                    <span className="badge bg-amber-50 text-amber-700">
                      <Bell size={11} /> Waiting for update
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-secondary btn-sm"><Edit3 size={13} /> Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}><Trash2 size={13} /></button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 mt-6 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <User size={14} style={{ color: "var(--text-tertiary)" }} />
              <div>
                <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Contact</div>
                <div className="text-[13px] font-medium">{client.contact_person}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={14} style={{ color: "var(--text-tertiary)" }} />
              <div>
                <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Email</div>
                <div className="text-[13px] font-medium">{client.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} style={{ color: "var(--text-tertiary)" }} />
              <div>
                <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Phone</div>
                <div className="text-[13px] font-medium">{client.phone || "—"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} style={{ color: "var(--text-tertiary)" }} />
              <div>
                <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Next Deadline</div>
                <div className="text-[13px] font-medium">{client.next_deadline ? formatDate(client.next_deadline) : "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Panels */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          {[
            { label: "Total Projects", value: totalProjects, icon: FolderKanban, color: "#6366F1", bg: "#EEF2FF" },
            { label: "Active", value: activeProjects, icon: Activity, color: "#10B981", bg: "#ECFDF5" },
            { label: "Completed", value: completedProjects, icon: CheckSquare, color: "#0EA5E9", bg: "#F0F9FF" },
            { label: "Delayed", value: delayedProjects, icon: AlertCircle, color: "#EF4444", bg: "#FEF2F2" },
            { label: "Overdue Tasks", value: client.overdue_tasks ?? 0, icon: Clock, color: "#EF4444", bg: "#FEF2F2" },
            { label: "Created", value: formatDate(client.created_at, "MMM yyyy"), icon: Calendar, color: "#8B5CF6", bg: "#F5F3FF" },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5" style={{ background: s.bg }}>
                <s.icon size={14} style={{ color: s.color }} />
              </div>
              <div className="text-[20px] font-semibold tracking-tight" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11.5px] mt-0.5 text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="card-lg overflow-hidden">
          <div
            className="flex border-b px-6"
            style={{ borderColor: "var(--border)" }}
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                className="px-4 py-3.5 text-[13px] font-medium border-b-2 transition-colors capitalize"
                style={{
                  borderColor: activeTab === tab ? "var(--accent)" : "transparent",
                  color: activeTab === tab ? "var(--accent)" : "var(--text-secondary)",
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Projects Tab */}
            {activeTab === "projects" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="font-semibold">Projects</div>
                  <Link href={`/projects?client=${id}`} className="btn btn-secondary btn-sm">
                    <Plus size={13} /> New Project
                  </Link>
                </div>
                {projects.length === 0 ? (
                  <div className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>No projects yet.</div>
                ) : (
                  <div className="space-y-3">
                    {(projects as Record<string, unknown>[]).map((p) => (
                      <Link
                        key={p.id as string}
                        href={`/projects/${p.id}`}
                        className="block p-4 rounded-xl border hover:border-indigo-200 transition-colors"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[14px]">{p.name as string}</div>
                            <div className="text-[12.5px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                              {p.description as string || "No description"}
                            </div>
                            <div className="flex items-center gap-3 mt-2.5">
                              <StatusBadge status={p.status as string} />
                              <PriorityBadge priority={p.priority as string} />
                              <HealthBadge health={p.health_status as string} />
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[13px] font-bold">{p.progress_percent as number}%</div>
                            <div className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>
                              Due {p.due_date ? formatDate(p.due_date as string) : "—"}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <ProgressBar value={p.progress_percent as number} showLabel={false} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div className="space-y-4">
                {activity.length === 0 ? (
                  <div className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>No activity yet.</div>
                ) : (
                  activity.map((log, i) => (
                    <div key={i} className="flex gap-4">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "var(--accent-light)" }}
                      >
                        <Activity size={14} style={{ color: "var(--accent)" }} />
                      </div>
                      <div>
                        <div className="text-[13.5px]">{log.description as string}</div>
                        <div className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                          {timeAgo(log.created_at as string)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <textarea
                    className="input-base flex-1"
                    rows={2}
                    placeholder="Add an internal note…"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <button className="btn btn-primary self-end" onClick={addNote} disabled={savingNote || !noteText.trim()}>
                    {savingNote ? "…" : "Add"}
                  </button>
                </div>
                {notes.length === 0 ? (
                  <div className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>No notes yet.</div>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-xl"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                    >
                      <p className="text-[13.5px]">{note.content}</p>
                      <div className="text-[11.5px] mt-2" style={{ color: "var(--text-tertiary)" }}>
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

      {/* Delete Confirm */}
      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Client?"
        subtitle="This will permanently delete the client and all associated data."
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowDelete(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p className="text-[13.5px]" style={{ color: "var(--text-secondary)" }}>
          Are you sure you want to delete <strong>{client.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </>
  );
}
