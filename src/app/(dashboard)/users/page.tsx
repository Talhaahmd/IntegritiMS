"use client";
import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/layout/TopBar";
import Modal from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { Users, Plus, Trash2, Eye, EyeOff, Check, X, Shield, FolderKanban, UserCog, BarChart3, AlertCircle, RefreshCw } from "lucide-react";

interface UserPermission {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  can_view_clients: boolean;
  can_add_team_members: boolean;
  can_assign_tasks: boolean;
  can_view_reports: boolean;
  is_active: boolean;
  created_at: string;
}

const MODULES = [
  { key: "can_view_clients",      label: "View Clients",     desc: "Access the clients module and client details", icon: Users },
  { key: "can_add_team_members",  label: "Manage Team",      desc: "Add, edit, and remove team members",           icon: UserCog },
  { key: "can_assign_tasks",      label: "Assign Tasks",     desc: "Create tasks and assign them to members",      icon: FolderKanban },
  { key: "can_view_reports",      label: "View Reports",     desc: "Access reports and analytics dashboard",       icon: BarChart3 },
] as const;

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 24,
        background: checked ? "#6366F1" : "#E5E7EB",
        border: "none", cursor: "pointer", position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3,
        left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
        transition: "left 0.2s",
      }} />
    </button>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<UserPermission | null>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    can_view_clients: true,
    can_add_team_members: false,
    can_assign_tasks: false,
    can_view_reports: false,
  });
  const [showPw, setShowPw] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const json = await res.json();
    setUsers(json.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        permissions: {
          can_view_clients: form.can_view_clients,
          can_add_team_members: form.can_add_team_members,
          can_assign_tasks: form.can_assign_tasks,
          can_view_reports: form.can_view_reports,
        },
      }),
    });
    const json = await res.json();
    if (json.error) {
      setError(json.error);
    } else {
      setShowModal(false);
      setForm({ email: "", password: "", full_name: "", can_view_clients: true, can_add_team_members: false, can_assign_tasks: false, can_view_reports: false });
      load();
    }
    setSaving(false);
  }

  async function handleTogglePermission(user: UserPermission, key: string, value: boolean) {
    setUsers(prev => prev.map(u => u.user_id === user.user_id ? { ...u, [key]: value } : u));
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id, permissions: { [key]: value } }),
    });
  }

  async function handleDelete(user: UserPermission) {
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id }),
    });
    setDeleteConfirm(null);
    load();
  }

  if (loading) return <><TopBar title="User Management" /><PageLoader /></>;

  return (
    <>
      <TopBar title="User Management" subtitle={`${users.length} users · Module-based access control`} />

      <div style={{ padding: "24px 28px 40px" }} className="animate-fade-up">

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Manage who can access the system and what modules they can use.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" style={{ height: 36, gap: 6, fontSize: 13 }} onClick={load}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button className="btn btn-primary" style={{ height: 36, gap: 6, fontSize: 13 }} onClick={() => setShowModal(true)}>
              <Plus size={14} /> Add User
            </button>
          </div>
        </div>

        {/* Users table */}
        <div className="card card-lg" style={{ overflow: "hidden" }}>
          {users.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center" }}>
              <Users size={32} style={{ color: "var(--text-tertiary)", margin: "0 auto 12px" }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>No users yet</div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>Add the first user to grant access.</div>
            </div>
          ) : (
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>USER</th>
                  <th style={{ padding: "12px 16px", textAlign: "center" }}>VIEW CLIENTS</th>
                  <th style={{ padding: "12px 16px", textAlign: "center" }}>MANAGE TEAM</th>
                  <th style={{ padding: "12px 16px", textAlign: "center" }}>ASSIGN TASKS</th>
                  <th style={{ padding: "12px 16px", textAlign: "center" }}>VIEW REPORTS</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.user_id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                          color: "#fff", fontSize: 13, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {(user.full_name || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>
                            {user.full_name || "—"}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{user.email}</div>
                        </div>
                        {user.role === "super_admin" && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: "#FEF3C7", color: "#92400E", padding: "2px 7px", borderRadius: 10 }}>
                            Super Admin
                          </span>
                        )}
                      </div>
                    </td>
                    {(["can_view_clients", "can_add_team_members", "can_assign_tasks", "can_view_reports"] as const).map(key => (
                      <td key={key} style={{ padding: "14px 16px", textAlign: "center" }}>
                        {user.role === "super_admin" ? (
                          <div style={{ display: "flex", justifyContent: "center" }}>
                            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Check size={12} style={{ color: "#059669" }} />
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", justifyContent: "center" }}>
                            <Toggle
                              checked={user[key]}
                              onChange={(v) => handleTogglePermission(user, key, v)}
                            />
                          </div>
                        )}
                      </td>
                    ))}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      {user.role !== "super_admin" && (
                        <button
                          onClick={() => setDeleteConfirm(user)}
                          style={{
                            width: 30, height: 30, borderRadius: 8,
                            border: "1px solid #FCA5A5",
                            background: "#FFF", color: "#DC2626",
                            cursor: "pointer", display: "inline-flex",
                            alignItems: "center", justifyContent: "center",
                          }}
                          title="Remove user"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Permission info */}
        <div className="card" style={{ marginTop: 16, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Shield size={14} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Module Access Guide</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {MODULES.map(({ key, label, desc, icon: Icon }) => (
              <div key={key} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Icon size={13} style={{ color: "var(--accent)" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{label}</span>
                </div>
                <p style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.5, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setError(""); }} title="Add New User" subtitle="Create account and set module access" size="md">
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5 }}>Full Name</label>
              <input className="input-base" placeholder="Muhammad Talha" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5 }}>Email Address <span style={{ color: "#EF4444" }}>*</span></label>
              <input className="input-base" type="email" required placeholder="user@integriti.io" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5 }}>Password <span style={{ color: "#EF4444" }}>*</span></label>
              <div style={{ position: "relative" }}>
                <input className="input-base" style={{ paddingRight: 38 }} type={showPw ? "text" : "password"} required placeholder="••••••••" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-tertiary)", marginBottom: 12 }}>Module Access</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {MODULES.map(({ key, label, desc, icon: Icon }) => (
                <div key={key} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px", borderRadius: 10,
                  background: "var(--surface-2)", border: "1px solid var(--border-subtle)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Icon size={14} style={{ color: "var(--accent)" }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{desc}</div>
                    </div>
                  </div>
                  <Toggle
                    checked={form[key as keyof typeof form] as boolean}
                    onChange={v => setForm(p => ({ ...p, [key]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "#FEF2F2", color: "#DC2626", fontSize: 13 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 8, borderTop: "1px solid var(--border-subtle)" }}>
            <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setError(""); }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 120 }}>
              {saving ? "Creating…" : "Create User"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Remove User" size="sm">
        {deleteConfirm && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Remove <strong>{deleteConfirm.full_name || deleteConfirm.email}</strong> from the system? This action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn" style={{ background: "#DC2626", color: "#fff" }} onClick={() => handleDelete(deleteConfirm)}>
                Remove User
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
