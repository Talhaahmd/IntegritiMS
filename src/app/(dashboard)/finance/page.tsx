"use client";
import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import {
  DollarSign, TrendingUp, CheckCircle, Clock, Filter,
  Building2, FolderKanban, Flag, BarChart2,
} from "lucide-react";

interface MilestoneRow {
  id: string;
  name: string;
  cost: number;
  is_paid: boolean;
  status: string;
  start_date: string | null;
  end_date: string | null;
  project_id: string | null;
  client_id: string | null;
  project_name?: string;
  client_name?: string;
  tasks?: { task_assignments?: { team_members?: { full_name: string } }[] }[];
}

/* ── Stat card ────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color, bg, Icon }: { label: string; value: string; sub?: string; color: string; bg: string; Icon: React.FC<{ size?: number; style?: React.CSSProperties }> }) {
  return (
    <div className="card hover-lift" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color, letterSpacing: "-1px" }}>{value}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ── Mini bar chart (monthly) ────────────────────────────────── */
function MonthlyChart({ data }: { data: { month: string; total: number; paid: number }[] }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="card-lg" style={{ padding: "20px 24px", marginBottom: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>Monthly Revenue</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, overflowX: "auto" }}>
        {data.map((d) => (
          <div key={d.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 52 }}>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: 100, gap: 2 }}>
              {/* paid portion */}
              <div style={{ width: 32, background: "#4F46E5", borderRadius: "4px 4px 0 0", height: `${(d.paid / max) * 100}%`, minHeight: d.paid > 0 ? 4 : 0, transition: "height 0.3s" }} title={`Paid: $${d.paid.toLocaleString()}`} />
              {/* unpaid portion */}
              {d.total > d.paid && (
                <div style={{ width: 32, background: "#C7D2FE", borderRadius: 0, height: `${((d.total - d.paid) / max) * 100}%`, minHeight: 4 }} title={`Unpaid: $${(d.total - d.paid).toLocaleString()}`} />
              )}
            </div>
            <div style={{ fontSize: 10.5, color: "var(--text-tertiary)", fontWeight: 500, whiteSpace: "nowrap" }}>{d.month}</div>
            <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600 }}>${(d.total / 1000).toFixed(0)}k</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
          <div style={{ width: 12, height: 12, background: "#4F46E5", borderRadius: 3 }} /> Paid
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
          <div style={{ width: 12, height: 12, background: "#C7D2FE", borderRadius: 3 }} /> Pending
        </div>
      </div>
    </div>
  );
}

/* ── Milestone status badge ─────────────────────────────────── */
const MS_COLORS: Record<string, { bg: string; color: string }> = {
  active:    { bg: "#EFF6FF", color: "#2563EB" },
  completed: { bg: "#ECFDF5", color: "#059669" },
  on_hold:   { bg: "#FFFBEB", color: "#B45309" },
  blocked:   { bg: "#FEF2F2", color: "#DC2626" },
};
function MsBadge({ status }: { status: string }) {
  const c = MS_COLORS[status] ?? { bg: "#F3F4F6", color: "#374151" };
  return <span style={{ display: "inline-flex", background: c.bg, color: c.color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{status.replace("_"," ")}</span>;
}

export default function FinancePage() {
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [loading, setLoading] = useState(true);

  /* Filters */
  const [clientFilter, setClientFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paidFilter, setPaidFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await createClient()
      .from("milestones")
      .select(`
        id, name, cost, is_paid, status, start_date, end_date, project_id, client_id,
        projects(name, clients(name)),
        clients(name),
        tasks(task_assignments(team_members(full_name)))
      `)
      .order("end_date", { ascending: false });

    const rows: MilestoneRow[] = (data ?? []).map((m: any) => ({
      id: m.id,
      name: m.name,
      cost: Number(m.cost),
      is_paid: m.is_paid,
      status: m.status,
      start_date: m.start_date,
      end_date: m.end_date,
      project_id: m.project_id,
      client_id: m.client_id,
      project_name: m.projects?.name,
      client_name: m.clients?.name ?? m.projects?.clients?.name,
      tasks: m.tasks ?? [],
    }));
    setMilestones(rows);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Update paid status */
  async function togglePaid(id: string, is_paid: boolean) {
    await createClient().from("milestones").update({ is_paid }).eq("id", id);
    load();
  }

  /* Derived lists for filter dropdowns */
  const clients = Array.from(new Map(milestones.filter(m => m.client_name).map(m => [m.client_id ?? m.project_id, m.client_name!])).entries()).map(([id, name]) => ({ id: id ?? "", name }));
  const projects = Array.from(new Map(milestones.filter(m => m.project_name).map(m => [m.project_id, m.project_name!])).entries()).map(([id, name]) => ({ id: id ?? "", name }));

  /* Apply filters */
  const filtered = milestones.filter((m) => {
    if (clientFilter !== "all") {
      const clientId = m.client_id ?? (/* via project */ undefined);
      if (clientId !== clientFilter && !(m.project_id && clientFilter !== "all" && m.client_name === clients.find(c => c.id === clientFilter)?.name)) {
        // fuzzy: match by name if id doesn't match
        const wantedName = clients.find(c => c.id === clientFilter)?.name;
        if (m.client_name !== wantedName) return false;
      }
    }
    if (projectFilter !== "all" && m.project_id !== projectFilter) return false;
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (paidFilter === "paid" && !m.is_paid) return false;
    if (paidFilter === "unpaid" && m.is_paid) return false;
    if (dateFrom && m.end_date && m.end_date < dateFrom) return false;
    if (dateTo && m.end_date && m.end_date > dateTo) return false;
    return true;
  });

  /* Stats */
  const totalRevenue = filtered.reduce((s, m) => s + m.cost, 0);
  const paidRevenue = filtered.filter(m => m.is_paid).reduce((s, m) => s + m.cost, 0);
  const unpaidRevenue = totalRevenue - paidRevenue;
  const completedCount = filtered.filter(m => m.status === "completed").length;

  /* Monthly breakdown */
  const monthlyMap: Record<string, { total: number; paid: number }> = {};
  filtered.forEach((m) => {
    const key = m.end_date ? m.end_date.slice(0, 7) : "No date";
    if (!monthlyMap[key]) monthlyMap[key] = { total: 0, paid: 0 };
    monthlyMap[key].total += m.cost;
    if (m.is_paid) monthlyMap[key].paid += m.cost;
  });
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month: month === "No date" ? "No date" : new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      total: v.total, paid: v.paid,
    }));

  /* Per-project summary */
  const projectMap: Record<string, { name: string; total: number; paid: number; count: number }> = {};
  filtered.forEach((m) => {
    const key = m.project_id ?? "__no_project__";
    if (!projectMap[key]) projectMap[key] = { name: m.project_name ?? "(No Project)", total: 0, paid: 0, count: 0 };
    projectMap[key].total += m.cost;
    if (m.is_paid) projectMap[key].paid += m.cost;
    projectMap[key].count++;
  });
  const projectSummary = Object.values(projectMap).sort((a, b) => b.total - a.total);

  /* Developers per milestone */
  function getMilestoneDevelopers(m: MilestoneRow): string[] {
    const names = new Set<string>();
    (m.tasks ?? []).forEach((t) => {
      (t.task_assignments ?? []).forEach((a) => {
        if (a.team_members?.full_name) names.add(a.team_members.full_name);
      });
    });
    return Array.from(names);
  }

  if (loading) return (<><TopBar title="Finance" /><PageLoader /></>);

  return (
    <>
      <TopBar title="Finance" subtitle="Revenue from milestones" />
      <div style={{ padding: "24px 28px 40px" }} className="animate-fade-in">

        {/* Summary stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} sub={`${filtered.length} milestones`} color="#4F46E5" bg="#EEF2FF" Icon={DollarSign} />
          <StatCard label="Paid / Collected" value={`$${paidRevenue.toLocaleString()}`} sub={`${filtered.filter(m => m.is_paid).length} milestones paid`} color="#059669" bg="#ECFDF5" Icon={CheckCircle} />
          <StatCard label="Outstanding" value={`$${unpaidRevenue.toLocaleString()}`} sub={`${filtered.filter(m => !m.is_paid).length} milestones pending`} color="#D97706" bg="#FFFBEB" Icon={Clock} />
          <StatCard label="Completed" value={String(completedCount)} sub={`of ${filtered.length} milestones`} color="#0EA5E9" bg="#F0F9FF" Icon={TrendingUp} />
        </div>

        {/* Monthly chart */}
        <MonthlyChart data={monthlyData} />

        {/* Filters */}
        <div className="card-lg" style={{ padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Filter size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <select className="input-base" style={{ height: 34, width: 160, fontSize: 12.5 }} value={clientFilter} onChange={e => { setClientFilter(e.target.value); setProjectFilter("all"); }}>
            <option value="all">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input-base" style={{ height: 34, width: 180, fontSize: 12.5 }} value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="input-base" style={{ height: 34, width: 140, fontSize: 12.5 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            {["active","completed","on_hold","blocked"].map(s => <option key={s} value={s}>{s.replace("_"," ").replace(/^\w/, c => c.toUpperCase())}</option>)}
          </select>
          <select className="input-base" style={{ height: 34, width: 130, fontSize: 12.5 }} value={paidFilter} onChange={e => setPaidFilter(e.target.value)}>
            <option value="all">Paid + Unpaid</option>
            <option value="paid">Paid only</option>
            <option value="unpaid">Unpaid only</option>
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="date" className="input-base" style={{ height: 34, fontSize: 12.5, width: 140 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From (end date)" />
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>→</span>
            <input type="date" className="input-base" style={{ height: 34, fontSize: 12.5, width: 140 }} value={dateTo} onChange={e => setDateTo(e.target.value)} title="To (end date)" />
          </div>
          {(clientFilter !== "all" || projectFilter !== "all" || statusFilter !== "all" || paidFilter !== "all" || dateFrom || dateTo) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setClientFilter("all"); setProjectFilter("all"); setStatusFilter("all"); setPaidFilter("all"); setDateFrom(""); setDateTo(""); }}>
              Clear filters
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
          {/* Milestone detail table */}
          <div className="card-lg" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <Flag size={15} style={{ color: "#4F46E5" }} /> Milestones
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "1px 8px", borderRadius: 999 }}>{filtered.length}</span>
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", fontSize: 13, color: "var(--text-tertiary)" }}>No milestones match your filters.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ minWidth: 640 }}>
                  <colgroup>
                    <col style={{ width: "22%" }} /><col style={{ width: "15%" }} />
                    <col style={{ width: "13%" }} /><col style={{ width: "10%" }} />
                    <col style={{ width: "12%" }} /><col style={{ width: "14%" }} />
                    <col style={{ width: "14%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Milestone</th><th>Project</th><th>Status</th>
                      <th>End Date</th><th>Revenue</th><th>Developer(s)</th><th>Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => {
                      const devs = getMilestoneDevelopers(m);
                      return (
                        <tr key={m.id}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.3 }}>{m.name}</div>
                            {m.client_name && <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}><Building2 size={10} />{m.client_name}</div>}
                          </td>
                          <td>
                            {m.project_name ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "var(--text-secondary)", fontWeight: 500 }}>
                                <FolderKanban size={11} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>{m.project_name}</span>
                              </div>
                            ) : <span style={{ color: "var(--text-tertiary)", fontSize: 12.5 }}>—</span>}
                          </td>
                          <td><MsBadge status={m.status} /></td>
                          <td style={{ fontSize: 12.5, fontWeight: 500 }}>{m.end_date ? formatDate(m.end_date, "MMM d") : "—"}</td>
                          <td>
                            <span style={{ fontSize: 13, fontWeight: 700, color: m.is_paid ? "#059669" : "var(--text-primary)" }}>
                              ${m.cost.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            {devs.length === 0 ? <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>—</span> : (
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {devs.slice(0, 2).map((d, i) => (
                                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{d.charAt(0)}</div>
                                    <span style={{ fontSize: 11.5, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 80 }}>{d}</span>
                                  </div>
                                ))}
                                {devs.length > 2 && <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>+{devs.length - 2} more</span>}
                              </div>
                            )}
                          </td>
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                              <input type="checkbox" checked={m.is_paid} onChange={(e) => togglePaid(m.id, e.target.checked)} style={{ accentColor: "#4F46E5", width: 15, height: 15 }} />
                              <span style={{ fontSize: 12, fontWeight: 600, color: m.is_paid ? "#059669" : "var(--text-tertiary)" }}>{m.is_paid ? "Paid" : "Pending"}</span>
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#F9FAFB", borderTop: "2px solid var(--border)" }}>
                      <td colSpan={4} style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Totals</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "#4F46E5" }}>${totalRevenue.toLocaleString()}</td>
                      <td></td>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "#059669" }}>${paidRevenue.toLocaleString()} paid</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Per-project summary sidebar */}
          <div className="card-lg" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--border)", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart2 size={15} style={{ color: "#4F46E5" }} /> By Project
            </div>
            {projectSummary.length === 0 ? (
              <div style={{ padding: "30px 20px", textAlign: "center", fontSize: 13, color: "var(--text-tertiary)" }}>No data</div>
            ) : (
              <div style={{ padding: "8px 0" }}>
                {projectSummary.map((ps) => (
                  <div key={ps.name} style={{ padding: "10px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{ps.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#4F46E5" }}>${ps.total.toLocaleString()}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>{ps.count} milestone{ps.count !== 1 ? "s" : ""}</div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: "#059669" }}>${ps.paid.toLocaleString()} paid</div>
                    </div>
                    {/* progress bar */}
                    <div style={{ marginTop: 6, height: 4, background: "#E5E7EB", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "#4F46E5", borderRadius: 99, width: `${ps.total > 0 ? (ps.paid / ps.total) * 100 : 0}%`, transition: "width 0.3s" }} />
                    </div>
                  </div>
                ))}
                <div style={{ padding: "12px 20px", background: "#F9FAFB" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}>
                    <span style={{ color: "var(--text-primary)" }}>Grand Total</span>
                    <span style={{ color: "#4F46E5" }}>${totalRevenue.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 3 }}>
                    <span style={{ color: "var(--text-tertiary)" }}>Collected</span>
                    <span style={{ color: "#059669", fontWeight: 600 }}>${paidRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
