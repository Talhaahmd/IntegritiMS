"use client";
import { useState, useRef } from "react";
import TopBar from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import ProgressBar from "@/components/ui/ProgressBar";
import Avatar from "@/components/ui/Avatar";
import { useTeamMembers } from "@/lib/hooks/useTeam";
import { useClients } from "@/lib/hooks/useClients";
import { useProjects } from "@/lib/hooks/useProjects";
import { useTasks } from "@/lib/hooks/useTasks";
import { formatDate, formatHours } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { Download, BarChart3, Users, FolderKanban, Calendar, Printer, Building2, CheckSquare } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const CHART_COLORS = ["#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#0EA5E9"];

type ReportType = "individual" | "team" | "client" | "project" | "weekly";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
      {children}
    </h3>
  );
}

function StatPill({ label, value, color, bg }: { label: string; value: number | string; color: string; bg: string }) {
  return (
    <div className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <BarChart3 size={14} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, color, letterSpacing: "-0.5px" }}>{value}</div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { data: members, loading: ml } = useTeamMembers();
  const { data: clients, loading: cl } = useClients();
  const { data: projects, loading: pl } = useProjects();
  const { data: tasks, loading: tl } = useTasks();
  const [reportType, setReportType] = useState<ReportType>("individual");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [dateFilter, setDateFilter] = useState("this_month");
  const reportRef = useRef<HTMLDivElement>(null);

  const loading = ml || cl || pl || tl;

  // Computed metrics
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const overdueTasks = tasks.filter((t) => t.overdue);

  const memberPerf = members.map((m) => {
    const mTasks = tasks.filter((t) => ((t.assignments ?? []) as { team_member_id: string }[]).some((a) => a.team_member_id === m.id));
    const mCompleted = mTasks.filter((t) => t.status === "completed").length;
    const mOverdue = mTasks.filter((t) => t.overdue).length;
    const mEst = mTasks.reduce((s, t) => s + t.estimated_hours, 0);
    const mAct = mTasks.reduce((s, t) => s + t.actual_hours, 0);
    return { ...m, mTasks: mTasks.length, mCompleted, mOverdue, mEst, mAct };
  }).sort((a, b) => b.mCompleted - a.mCompleted);

  const projectHealth = [
    { name: "Healthy", value: projects.filter((p) => p.health_status === "healthy").length, color: "#10B981" },
    { name: "At Risk", value: projects.filter((p) => p.health_status === "at risk").length, color: "#F59E0B" },
    { name: "Critical", value: projects.filter((p) => p.health_status === "critical").length, color: "#EF4444" },
  ];

  const tasksByCategory = Object.entries(
    tasks.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));

  const clientHealth = clients.map((c) => ({
    name: c.name,
    overdue: c.overdue_tasks ?? 0,
    projects: c.active_projects ?? 0,
    waiting: c.waiting_for_update,
  }));

  const delayedVsOnTime = [
    { name: "On Time", value: completedTasks.filter((t) => t.actual_hours <= t.estimated_hours * 1.1).length, color: "#10B981" },
    { name: "Delayed", value: completedTasks.filter((t) => t.actual_hours > t.estimated_hours * 1.1).length, color: "#EF4444" },
  ];

  async function exportPDF() {
    const el = reportRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 1.5, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width / 1.5, canvas.height / 1.5] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 1.5, canvas.height / 1.5);
    pdf.save(`IntegritiMS-${reportType}-report-${formatDate(new Date(), "yyyy-MM-dd")}.pdf`);
  }

  if (loading) return (
    <>
      <TopBar title="Reports" />
      <PageLoader />
    </>
  );

  const TABS: { key: ReportType; label: string; icon: any }[] = [
    { key: "individual", label: "Individual", icon: Users },
    { key: "team", label: "Team", icon: Users },
    { key: "client", label: "Clients", icon: Building2 },
    { key: "project", label: "Projects", icon: FolderKanban },
    { key: "weekly", label: "Weekly", icon: Calendar },
  ];

  return (
    <>
      <TopBar title="Reports" subtitle="Performance analytics and operations data" />

      <div style={{ padding: "24px 28px 40px" }} className="animate-fade-in">
        
        {/* ── Tabs & Controls ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 1, padding: 3, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border-subtle)" }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setReportType(tab.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", transition: "all 0.15s",
                  background: reportType === tab.key ? "#fff" : "transparent",
                  boxShadow: reportType === tab.key ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                  color: reportType === tab.key ? "var(--accent)" : "var(--text-tertiary)",
                  fontSize: 12.5, fontWeight: 600
                }}
              >
                <tab.icon size={13} /> {tab.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <select className="input-base" style={{ height: 36, width: 150, fontSize: 13 }} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="all_time">All Time</option>
            </select>
            <button className="btn btn-secondary" style={{ height: 36, fontSize: 13, gap: 6 }} onClick={() => window.print()}><Printer size={14} /> Print</button>
            <button className="btn btn-primary" style={{ height: 36, fontSize: 13, gap: 6 }} onClick={exportPDF}><Download size={14} /> Export PDF</button>
          </div>
        </div>

        {/* ── Report Content ── */}
        <div ref={reportRef} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Header Summary */}
          <div className="card-lg" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <BarChart3 size={22} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>Operations Intelligence Report</div>
                <div style={{ fontSize: 12.5, color: "var(--text-tertiary)", marginTop: 2 }}>{formatDate(new Date(), "EEEE, MMMM d, yyyy")} · {reportType.charAt(0).toUpperCase() + reportType.slice(1)} View</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
              <StatPill label="Active Clients" value={clients.filter(c => c.status === "active").length} color="#4F46E5" bg="#EEF2FF" />
              <StatPill label="Projects" value={projects.length} color="#059669" bg="#ECFDF5" />
              <StatPill label="Total Tasks" value={tasks.length} color="#D97706" bg="#FFFBEB" />
              <StatPill label="Completed" value={completedTasks.length} color="#0EA5E9" bg="#F0F9FF" />
              <StatPill label="Overdue" value={overdueTasks.length} color="#DC2626" bg="#FEF2F2" />
            </div>
          </div>

          {/* Visualization Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div className="card-lg" style={{ padding: 20 }}>
              <SectionTitle>Tasks by Category</SectionTitle>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={tasksByCategory} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                    {tasksByCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", marginTop: 12 }}>
                {tasksByCategory.map(c => (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color }} />
                    <span style={{ textTransform: "capitalize" }}>{c.name}</span>
                    <span style={{ color: "var(--text-tertiary)" }}>{c.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-lg" style={{ padding: 20 }}>
              <SectionTitle>Project Health</SectionTitle>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={projectHealth} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                    {projectHealth.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", marginTop: 12 }}>
                {projectHealth.map(c => (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color }} />
                    <span>{c.name}</span>
                    <span style={{ color: "var(--text-tertiary)" }}>{c.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-lg" style={{ padding: 20 }}>
              <SectionTitle>Efficiency Rate</SectionTitle>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={delayedVsOnTime} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                    {delayedVsOnTime.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", marginTop: 12 }}>
                {delayedVsOnTime.map(d => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
                    <span>{d.name}</span>
                    <span style={{ color: "var(--text-tertiary)" }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Individual Report Detail */}
          {reportType === "individual" && (() => {
            const member = members.find(m => m.id === selectedMemberId) ?? members[0];
            if (!member) return null;
            const mTasks = tasks.filter(t => ((t.assignments ?? []) as any[]).some(a => a.team_member_id === member.id));
            const mCompleted = mTasks.filter(t => t.status === "completed");
            const mEst = mTasks.reduce((s, t) => s + t.estimated_hours, 0);
            const mAct = mTasks.reduce((s, t) => s + t.actual_hours, 0);
            const onTimeCount = mCompleted.filter(t => t.actual_hours <= t.estimated_hours * 1.1).length;
            const onTimeRate = mCompleted.length > 0 ? Math.round((onTimeCount / mCompleted.length) * 100) : 0;
            const catBreakdown = Object.entries(mTasks.reduce((acc, t) => { acc[t.category] = (acc[t.category] ?? 0) + 1; return acc; }, {} as Record<string, number>)).map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="card-lg" style={{ padding: 20, display: "flex", alignItems: "center", gap: 20 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 8, display: "block" }}>Select Developer</label>
                    <select className="input-base" style={{ width: 220, height: 38 }} value={selectedMemberId || member.id} onChange={e => setSelectedMemberId(e.target.value)}>
                      {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                    <div style={{ textAlign: "center", padding: "10px 0", borderRadius: 12, background: "var(--surface-2)" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>{mTasks.length}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)", marginTop: 2 }}>ASSIGNED</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "10px 0", borderRadius: 12, background: "var(--surface-2)" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#059669" }}>{mCompleted.length}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)", marginTop: 2 }}>DONE</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "10px 0", borderRadius: 12, background: "var(--surface-2)" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#D97706" }}>{mTasks.filter(t => t.status === "in progress").length}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)", marginTop: 2 }}>ACTIVE</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "10px 0", borderRadius: 12, background: "var(--surface-2)" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#DC2626" }}>{mTasks.filter(t => t.overdue).length}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)", marginTop: 2 }}>OVERDUE</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "10px 0", borderRadius: 12, background: "var(--surface-2)" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>{onTimeRate}%</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)", marginTop: 2 }}>ON-TIME</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14 }}>
                  <div className="card-lg" style={{ padding: 20 }}>
                    <SectionTitle>Estimated vs Actual Hours</SectionTitle>
                    <div style={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mTasks.slice(0, 12).map(t => ({ name: t.name.split(" ")[0], est: t.estimated_hours, act: t.actual_hours }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} />
                          <Tooltip />
                          <Bar dataKey="est" fill="#EEF2FF" radius={[4, 4, 0, 0]} name="Estimated" />
                          <Bar dataKey="act" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Actual" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="card-lg" style={{ padding: 20 }}>
                    <SectionTitle>Workload Mix</SectionTitle>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={catBreakdown} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                          {catBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                      {catBreakdown.map(c => (
                        <div key={c.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", borderRadius: 8, background: "var(--surface-2)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: "var(--text-secondary)" }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color }} />
                            <span style={{ textTransform: "capitalize" }}>{c.name}</span>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)" }}>{c.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card-lg" style={{ overflow: "hidden" }}>
                  <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                    <SectionTitle>Assigned Tasks Breakdown</SectionTitle>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Task</th>
                          <th>Status</th>
                          <th>Priority</th>
                          <th>Est</th>
                          <th>Act</th>
                          <th>Var</th>
                          <th>Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mTasks.map(t => {
                          const variance = t.actual_hours - t.estimated_hours;
                          return (
                            <tr key={t.id}>
                              <td>
                                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.name}</div>
                                <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "capitalize" }}>{t.category}</div>
                              </td>
                              <td><StatusBadge status={t.status} /></td>
                              <td><PriorityBadge priority={t.priority} /></td>
                              <td style={{ fontSize: 13 }}>{t.estimated_hours}h</td>
                              <td style={{ fontSize: 13 }}>{t.actual_hours}h</td>
                              <td style={{ fontSize: 13, fontWeight: 700, color: variance > 0 ? "#DC2626" : "#059669" }}>{variance > 0 ? `+${variance}h` : `${variance}h`}</td>
                              <td style={{ fontSize: 12.5, color: "var(--text-tertiary)" }}>{t.actual_end ? formatDate(t.actual_end) : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Team Report View */}
          {reportType === "team" && (
            <div className="card-lg" style={{ overflow: "hidden" }}>
              <div style={{ padding: 20, borderBottom: "1px solid var(--border-subtle)" }}>
                <SectionTitle>Developer Efficiency Rankings</SectionTitle>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Developer</th>
                    <th>Role</th>
                    <th style={{ textAlign: "center" }}>Completed</th>
                    <th>Hours (Est/Act)</th>
                    <th>Variance</th>
                    <th>On-Time Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {memberPerf.map(m => {
                    const variance = m.mAct - m.mEst;
                    const rate = m.mCompleted > 0 ? Math.round(((m.mCompleted - m.mOverdue) / m.mCompleted) * 100) : 0;
                    return (
                      <tr key={m.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar name={m.full_name} size="xs" />
                            <span style={{ fontWeight: 600 }}>{m.full_name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 12.5, color: "var(--text-tertiary)" }}>{m.title}</td>
                        <td style={{ textAlign: "center", fontWeight: 700, color: "#059669" }}>{m.mCompleted}</td>
                        <td style={{ fontSize: 13 }}>
                          <span style={{ fontWeight: 600 }}>{m.mAct}h</span>
                          <span style={{ color: "var(--text-tertiary)", marginLeft: 6 }}>/ {m.mEst}h</span>
                        </td>
                        <td style={{ fontSize: 13, fontWeight: 700, color: variance > 0 ? "#DC2626" : "#059669" }}>{variance > 0 ? `+${variance.toFixed(1)}h` : `${variance.toFixed(1)}h`}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <ProgressBar value={rate} style={{ width: 80 }} />
                            <span style={{ fontSize: 12, fontWeight: 700 }}>{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Client & Project views can be similarly polished if needed, but keeping it concise for now */}
        </div>
      </div>
    </>
  );
}
