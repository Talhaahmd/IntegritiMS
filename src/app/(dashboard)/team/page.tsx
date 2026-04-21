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
import { UserCog, Plus, Search, Mail, Phone, Clock, CheckSquare, LayoutGrid, List } from "lucide-react";
import Link from "next/link";

const AVAIL_COLORS: Record<string, string> = {
  available: "emerald",
  "partially available": "amber",
  "fully booked": "red",
  "on leave": "slate",
};

function TeamForm({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    full_name: "", title: "", department: "", primary_skill: "",
    expertise: [] as string[],
    experience_level: "mid", availability_status: "available",
    email: "", phone: "", joining_date: "", hourly_rate: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

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

  const F = ({ label, name, type = "text", required = false }: { label: string; name: string; type?: string; required?: boolean }) => (
    <div>
      <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</label>
      <input
        type={type}
        className="input-base"
        required={required}
        value={(form as Record<string, unknown>)[name] as string}
        onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
      />
    </div>
  );

  const Select = ({ label, name, options }: { label: string; name: string; options: { value: string; label: string }[] }) => (
    <div>
      <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</label>
      <select className="input-base" value={(form as Record<string, unknown>)[name] as string} onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <F label="Full Name" name="full_name" required />
        <F label="Title / Role" name="title" required />
        <F label="Department" name="department" />
        <F label="Primary Skill" name="primary_skill" required />
        <F label="Email" name="email" type="email" required />
        <F label="Phone" name="phone" />
        <F label="Joining Date" name="joining_date" type="date" />
        <F label="Hourly Rate ($)" name="hourly_rate" type="number" />
        <Select label="Experience Level" name="experience_level" options={["junior","mid","senior","lead","expert"].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))} />
        <Select label="Availability" name="availability_status" options={["available","partially available","fully booked","on leave"].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))} />
      </div>

      <div>
        <label className="block text-[12.5px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Expertise (select all that apply)</label>
        <div className="flex flex-wrap gap-2">
          {EXPERTISE_OPTIONS.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => toggleExpertise(ex)}
              className={`chip transition-all text-[12px] cursor-pointer ${form.expertise.includes(ex) ? "bg-indigo-600 text-white" : ""}`}
              style={!form.expertise.includes(ex) ? { background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" } : {}}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Notes</label>
        <textarea className="input-base" rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Add Member"}</button>
      </div>
    </form>
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
      <TopBar title="Team Manager" subtitle={`${members.length} team members`} />

      <div className="p-8 animate-fade-in">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
              <input className="input-base pl-9 h-9 w-64" placeholder="Search team…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="input-base h-9 w-48" value={availFilter} onChange={(e) => setAvailFilter(e.target.value)}>
              <option value="all">All Availability</option>
              {["available","partially available","fully booked","on leave"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--surface-2)" }}>
              <button className={`p-1.5 rounded-md transition-all ${viewMode === "card" ? "bg-white shadow-sm" : ""}`} onClick={() => setViewMode("card")}><LayoutGrid size={15} /></button>
              <button className={`p-1.5 rounded-md transition-all ${viewMode === "table" ? "bg-white shadow-sm" : ""}`} onClick={() => setViewMode("table")}><List size={15} /></button>
            </div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Add Member</button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Members", value: members.length, color: "#6366F1", bg: "#EEF2FF" },
            { label: "Available", value: members.filter((m) => m.availability_status === "available").length, color: "#10B981", bg: "#ECFDF5" },
            { label: "Partially Available", value: members.filter((m) => m.availability_status === "partially available").length, color: "#F59E0B", bg: "#FFFBEB" },
            { label: "Fully Booked", value: members.filter((m) => m.availability_status === "fully booked").length, color: "#EF4444", bg: "#FEF2F2" },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="w-8 h-8 rounded-xl mb-3 flex items-center justify-center" style={{ background: s.bg }}>
                <UserCog size={14} style={{ color: s.color }} />
              </div>
              <div className="text-[22px] font-semibold tracking-tight" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[12px] mt-0.5 text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card-lg">
            <EmptyState icon={UserCog} title="No team members found" description="Add your first team member to get started." action={
              <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={13} />Add Member</button>
            } />
          </div>
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((member) => {
              const availColor = AVAIL_COLORS[member.availability_status] ?? "slate";
              const onTimeRate = member.completed_tasks && member.completed_tasks > 0
                ? Math.min(100, Math.round((member.completed_tasks / (member.completed_tasks + (member.active_tasks ?? 0))) * 100))
                : 0;

              return (
                <Link key={member.id} href={`/team/${member.id}`} className="card-lg p-5 block hover:shadow-md transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar name={member.full_name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[14px] text-gray-900 truncate">{member.full_name}</div>
                      <div className="text-[12px] mt-0.5 text-gray-500">{member.title}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`badge bg-${availColor}-50 text-${availColor}-700 text-[11px]`} style={{ fontSize: 10.5 }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          {member.availability_status}
                        </span>
                        <span className="chip bg-slate-100 text-slate-500 text-[10.5px]">{member.experience_level}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[12.5px]">
                      <span style={{ color: "var(--text-secondary)" }}>On-time rate</span>
                      <span className="font-semibold">{onTimeRate}%</span>
                    </div>
                    <ProgressBar value={onTimeRate} />
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-[17px] font-semibold text-indigo-600">{member.active_tasks ?? 0}</div>
                      <div className="text-[10.5px] text-gray-400 mt-0.5">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[17px] font-semibold text-emerald-600">{member.completed_tasks ?? 0}</div>
                      <div className="text-[10.5px] text-gray-400 mt-0.5">Done</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[17px] font-semibold text-gray-700">{member.total_assigned_hours ?? 0}h</div>
                      <div className="text-[10.5px] text-gray-400 mt-0.5">Hours</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="chip bg-indigo-50 text-indigo-700 text-[11px]">{member.primary_skill}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card-lg overflow-hidden">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Skill</th>
                  <th>Availability</th>
                  <th>Active Tasks</th>
                  <th>Completed</th>
                  <th>Hours</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <Link href={`/team/${m.id}`} className="flex items-center gap-3 hover:underline">
                        <Avatar name={m.full_name} size="sm" />
                        <div>
                          <div className="font-medium text-[13.5px]">{m.full_name}</div>
                          <div className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>{m.experience_level}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="text-[13px]">{m.title}</td>
                    <td><span className="chip bg-indigo-50 text-indigo-700 text-[11px]">{m.primary_skill}</span></td>
                    <td>
                      <span className={`badge bg-${AVAIL_COLORS[m.availability_status] ?? "slate"}-50 text-${AVAIL_COLORS[m.availability_status] ?? "slate"}-700 capitalize`}>
                        {m.availability_status}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 text-[13px]">
                        <Clock size={12} style={{ color: "var(--text-tertiary)" }} />
                        {m.active_tasks ?? 0}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 text-[13px] text-emerald-600">
                        <CheckSquare size={12} />
                        {m.completed_tasks ?? 0}
                      </span>
                    </td>
                    <td className="text-[13px]">{m.total_assigned_hours ?? 0}h</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <a href={`mailto:${m.email}`} className="btn btn-icon btn-ghost btn-sm"><Mail size={12} /></a>
                        {m.phone && <a href={`tel:${m.phone}`} className="btn btn-icon btn-ghost btn-sm"><Phone size={12} /></a>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Team Member" size="xl">
        <TeamForm onSave={() => { setShowModal(false); reload(); }} onClose={() => setShowModal(false)} />
      </Modal>
    </>
  );
}
