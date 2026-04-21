"use client";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import Avatar from "@/components/ui/Avatar";
import ProgressBar from "@/components/ui/ProgressBar";
import { useTeamMembers, createTeamMemberRecord } from "@/lib/hooks/useTeam";
import { EXPERTISE_OPTIONS, TeamMember } from "@/types";
import { UserCog, Plus, Search, Mail, Phone, Clock, CheckSquare, LayoutGrid, List, ChevronRight } from "lucide-react";
import Link from "next/link";

const AVAIL_COLORS: Record<string, string> = {
  available: "emerald",
  "partially available": "amber",
  "fully booked": "red",
  "on leave": "slate",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: 5,
  letterSpacing: "0.01em",
};

/* ── Field components moved OUTSIDE to avoid focus loss ── */
function TeamFormField({ label, name, type = "text", required = false, value, onChange }: { 
  label: string; name: string; type?: string; required?: boolean; value: string | number; onChange: (name: string, val: string) => void 
}) {
  return (
    <div>
      <label style={labelStyle}>{label}{required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}</label>
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

function TeamFormSelect({ label, name, options, value, onChange }: { 
  label: string; name: string; options: { value: string; label: string }[]; value: string; onChange: (name: string, val: string) => void 
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select className="input-base" value={value} onChange={(e) => onChange(name, e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function TeamForm({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    full_name: "", title: "", department: "", primary_skill: "",
    expertise: [] as string[],
    experience_level: "mid", availability_status: "available",
    email: "", phone: "", joining_date: "", hourly_rate: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  function handleChange(name: string, val: string) {
    setForm(p => ({ ...p, [name]: val }));
  }

  function toggleExpertise(ex: string) {
    setForm((p) => ({
      ...p,
      expertise: p.expertise.includes(ex) ? p.expertise.filter((e) => e !== ex) : [...p.expertise, ex],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await createTeamMemberRecord({
      ...form,
      hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : undefined,
    } as Partial<TeamMember>);
    setSaving(false);
    onSave();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12 }}>
        Personal Details
      </div>
      <div className="grid grid-cols-2 gap-4 mb-18" style={{ marginBottom: 18 }}>
        <TeamFormField label="Full Name" name="full_name" required value={form.full_name} onChange={handleChange} />
        <TeamFormField label="Email" name="email" type="email" required value={form.email} onChange={handleChange} />
        <TeamFormField label="Phone" name="phone" value={form.phone} onChange={handleChange} />
        <TeamFormField label="Joining Date" name="joining_date" type="date" value={form.joining_date} onChange={handleChange} />
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12, paddingTop: 6, borderTop: "1px solid var(--border-subtle)" }}>
        Professional Info
      </div>
      <div className="grid grid-cols-2 gap-4 mb-18" style={{ marginBottom: 18 }}>
        <TeamFormField label="Title / Role" name="title" required value={form.title} onChange={handleChange} />
        <TeamFormField label="Department" name="department" value={form.department} onChange={handleChange} />
        <TeamFormField label="Primary Skill" name="primary_skill" required value={form.primary_skill} onChange={handleChange} />
        <TeamFormField label="Hourly Rate ($)" name="hourly_rate" type="number" value={form.hourly_rate} onChange={handleChange} />
        <TeamFormSelect label="Experience Level" name="experience_level" options={["junior","mid","senior","lead","expert"].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))} value={form.experience_level} onChange={handleChange} />
        <TeamFormSelect label="Availability" name="availability_status" options={["available","partially available","fully booked","on leave"].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))} value={form.availability_status} onChange={handleChange} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>Expertise (select all that apply)</label>
        <div className="flex flex-wrap gap-2">
          {EXPERTISE_OPTIONS.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => toggleExpertise(ex)}
              className={`chip transition-all text-[11.5px] cursor-pointer ${form.expertise.includes(ex) ? "bg-indigo-600 text-white" : ""}`}
              style={!form.expertise.includes(ex) ? { background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" } : {}}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Notes</label>
        <textarea className="input-base" rows={2} placeholder="Internal notes about team member..." value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
        <button type="button" className="btn btn-secondary" onClick={onClose} style={{ height: 36, fontSize: 13 }}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ height: 36, fontSize: 13, minWidth: 120 }}>{saving ? "Saving…" : "Add Member"}</button>
      </div>
    </form>
  );
}

function StatPill({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className="card" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <UserCog size={16} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color, letterSpacing: "-0.5px" }}>{value}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const { data: members, loading, reload } = useTeamMembers();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "card">("card");
  const [showModal, setShowModal] = useState(false);
  const [availFilter, setAvailFilter] = useState("all");

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.full_name.toLowerCase().includes(q) || m.title.toLowerCase().includes(q) || m.primary_skill.toLowerCase().includes(q);
    const matchAvail = availFilter === "all" || m.availability_status === availFilter;
    return matchSearch && matchAvail;
  });

  if (loading) return (
    <>
      <TopBar title="Team Manager" />
      <PageLoader />
    </>
  );

  return (
    <>
      <TopBar title="Team Manager" subtitle={`${members.length} total team members`} />

      <div style={{ padding: "24px 28px 40px" }} className="animate-fade-in">
        
        {/* ── Summary Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          <StatPill label="Total Members" value={members.length} color="#4F46E5" bg="#EEF2FF" />
          <StatPill label="Available" value={members.filter((m) => m.availability_status === "available").length} color="#059669" bg="#ECFDF5" />
          <StatPill label="Partially Available" value={members.filter((m) => m.availability_status === "partially available").length} color="#D97706" bg="#FFFBEB" />
          <StatPill label="Fully Booked" value={members.filter((m) => m.availability_status === "fully booked").length} color="#DC2626" bg="#FEF2F2" />
        </div>

        {/* ── Toolbar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
              <input className="input-base" style={{ paddingLeft: 30, height: 36, width: 260, fontSize: 13 }} placeholder="Search team by name, role or skill..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="input-base" style={{ height: 36, width: 180, fontSize: 13 }} value={availFilter} onChange={(e) => setAvailFilter(e.target.value)}>
              <option value="all">All Availability</option>
              {["available","partially available","fully booked","on leave"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 1, padding: 3, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border-subtle)" }}>
              <button style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: viewMode === "card" ? "#fff" : "transparent", boxShadow: viewMode === "card" ? "0 2px 6px rgba(0,0,0,0.06)" : "none", color: viewMode === "card" ? "var(--accent)" : "var(--text-tertiary)", cursor: "pointer", transition: "all 0.15s" }} onClick={() => setViewMode("card")}><LayoutGrid size={15} /></button>
              <button style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: viewMode === "table" ? "#fff" : "transparent", boxShadow: viewMode === "table" ? "0 2px 6px rgba(0,0,0,0.06)" : "none", color: viewMode === "table" ? "var(--accent)" : "var(--text-tertiary)", cursor: "pointer", transition: "all 0.15s" }} onClick={() => setViewMode("table")}><List size={15} /></button>
            </div>
            <button className="btn btn-primary" style={{ height: 36, fontSize: 13, gap: 6 }} onClick={() => setShowModal(true)}><Plus size={14} /> Add Member</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card-lg">
            <EmptyState icon={UserCog} title="No team members found" description="Add your first team member to get started." action={
              <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={13} />Add Member</button>
            } />
          </div>
        ) : viewMode === "card" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {filtered.map((member) => {
              const availColor = AVAIL_COLORS[member.availability_status] ?? "slate";
              const onTimeRate = member.completed_tasks && member.completed_tasks > 0
                ? Math.min(100, Math.round((member.completed_tasks / (member.completed_tasks + (member.active_tasks ?? 0))) * 100))
                : 0;

              return (
                <Link key={member.id} href={`/team/${member.id}`} style={{ textDecoration: "none" }} className="card-lg hover-lift">
                  <div style={{ padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                      <Avatar name={member.full_name} size="lg" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.full_name}</div>
                        <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>{member.title}</div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
                          <span style={{ 
                            display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 600,
                            background: `var(--${availColor}-light)`, color: `var(--${availColor})`, border: `1px solid var(--${availColor}-subtle)` 
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
                            {member.availability_status}
                          </span>
                          <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 600, background: "var(--surface-2)", color: "var(--text-tertiary)", border: "1px solid var(--border)" }}>
                            {member.experience_level.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", marginBottom: 6 }}>
                        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Efficiency</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{onTimeRate}%</span>
                      </div>
                      <ProgressBar value={onTimeRate} showLabel={false} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, padding: "14px 0", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>{member.active_tasks ?? 0}</div>
                        <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", marginTop: 2 }}>Active</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#059669" }}>{member.completed_tasks ?? 0}</div>
                        <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", marginTop: 2 }}>Done</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{member.total_assigned_hours ?? 0}h</div>
                        <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", marginTop: 2 }}>Hours</div>
                      </div>
                    </div>

                    <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: "var(--accent-light)", color: "var(--accent)" }}>
                        {member.primary_skill}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-tertiary)" }}>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card-lg" style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ minWidth: 1000 }}>
                <colgroup>
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role / Department</th>
                    <th>Skill</th>
                    <th>Availability</th>
                    <th>Active</th>
                    <th>Done</th>
                    <th>Hours</th>
                    <th>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const availColor = AVAIL_COLORS[m.availability_status] ?? "slate";
                    return (
                      <tr key={m.id}>
                        <td>
                          <Link href={`/team/${m.id}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
                            <Avatar name={m.full_name} size="sm" />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)" }}>{m.full_name}</div>
                              <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 2 }}>{m.experience_level.toUpperCase()}</div>
                            </div>
                          </Link>
                        </td>
                        <td>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{m.title}</div>
                          <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 2 }}>{m.department || "General"}</div>
                        </td>
                        <td>
                          <span style={{ padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: "var(--accent-light)", color: "var(--accent)" }}>
                            {m.primary_skill}
                          </span>
                        </td>
                        <td>
                          <span style={{ 
                            display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                            background: `var(--${availColor}-light)`, color: `var(--${availColor})`, border: `1px solid var(--${availColor}-subtle)` 
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
                            {m.availability_status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>
                            <Clock size={12} style={{ color: "var(--text-tertiary)" }} />
                            {m.active_tasks ?? 0}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "#059669" }}>
                            <CheckSquare size={12} />
                            {m.completed_tasks ?? 0}
                          </div>
                        </td>
                        <td style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{m.total_assigned_hours ?? 0}h</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <a href={`mailto:${m.email}`} className="btn btn-icon btn-ghost btn-sm" title={m.email}><Mail size={13} /></a>
                            {m.phone && <a href={`tel:${m.phone}`} className="btn btn-icon btn-ghost btn-sm" title={m.phone}><Phone size={13} /></a>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Team Member" subtitle="Onboard a new member to your team." size="lg">
        <TeamForm onSave={() => { setShowModal(false); reload(); }} onClose={() => setShowModal(false)} />
      </Modal>
    </>
  );
}
