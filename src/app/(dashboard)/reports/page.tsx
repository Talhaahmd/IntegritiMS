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
import { Download, BarChart3, Users, FolderKanban, Calendar, Printer } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const CHART_COLORS = ["#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#0EA5E9"];

type ReportType = "individual" | "team" | "client" | "project" | "weekly";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11.5px] font-semibold uppercase tracking-widest mb-4 pb-2 border-b border-gray-100 text-gray-400">
      {children}
    </h3>
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
  const totalEst = tasks.reduce((s, t) => s + t.estimated_hours, 0);
  const totalAct = tasks.reduce((s, t) => s + t.actual_hours, 0);

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

  const TABS: { key: ReportType; label: string; icon: typeof BarChart3 }[] = [
    { key: "individual", label: "Individual", icon: Users },
    { key: "team", label: "Team", icon: Users },
    { key: "client", label: "Clients", icon: Users },
    { key: "project", label: "Projects", icon: FolderKanban },
    { key: "weekly", label: "Weekly", icon: Calendar },
  ];

  return (
    <>
      <TopBar title="Reports" subtitle="Generated from real data" />

      <div className="p-8 animate-fade-in">
        {/* Report type selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all border ${
                  reportType === tab.key
                    ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                    : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50 hover:text-gray-700"
                }`}
                onClick={() => setReportType(tab.key)}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <select className="input-base h-9 w-40" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="all_time">All Time</option>
            </select>
            <button className="btn btn-secondary" onClick={() => window.print()}><Printer size={14} /> Print</button>
            <button className="btn btn-primary" onClick={exportPDF}><Download size={14} /> Export PDF</button>
          </div>
        </div>

        {/* Report Content */}
        <div ref={reportRef} className="space-y-6">
          {/* Common summary bar */}
          <div className="card-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-light)" }}>
                <BarChart3 size={18} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <div className="font-bold text-[16px]">IntegritiMS Operations Report</div>
                <div className="text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
                  Generated on {formatDate(new Date(), "EEEE, MMMM d, yyyy")} · {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
                </div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {[
                { label: "Active Clients", value: clients.filter((c) => c.status === "active").length, color: "#6366F1", bg: "#EEF2FF" },
                { label: "Total Projects", value: projects.length, color: "#10B981", bg: "#ECFDF5" },
                { label: "Total Tasks", value: tasks.length, color: "#F59E0B", bg: "#FFFBEB" },
                { label: "Completed Tasks", value: completedTasks.length, color: "#0EA5E9", bg: "#F0F9FF" },
                { label: "Overdue Tasks", value: overdueTasks.length, color: "#EF4444", bg: "#FEF2F2" },
              ].map((s) => (
                <div key={s.label} className="p-4 rounded-xl border border-gray-100" style={{ background: s.bg }}>
                  <div className="text-[24px] font-semibold tracking-tight" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[12px] mt-1 text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card-lg p-5">
              <div className="font-semibold text-[13.5px] mb-3">Tasks by Category</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={tasksByCategory} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                    {tasksByCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {tasksByCategory.map((c) => (
                  <div key={c.name} className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                    <span className="capitalize">{c.name}</span> ({c.value})
                  </div>
                ))}
              </div>
            </div>

            <div className="card-lg p-5">
              <div className="font-semibold text-[13.5px] mb-3">Project Health</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={projectHealth} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                    {projectHealth.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2">
                {projectHealth.map((c) => (
                  <div key={c.name} className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                    {c.name} ({c.value})
                  </div>
                ))}
              </div>
            </div>

            <div className="card-lg p-5">
              <div className="font-semibold text-[13.5px] mb-3">On-Time vs Delayed</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={delayedVsOnTime} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                    {delayedVsOnTime.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                {delayedVsOnTime.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Individual Report */}
          {reportType === "individual" && (() => {
            const member = members.find((m) => m.id === selectedMemberId) ?? members[0];
            if (!member) return <div className="card-lg p-8 text-center text-gray-400 text-[13px]">No team members found.</div>;
            const mTasks = tasks.filter((t) => ((t.assignments ?? []) as { team_member_id: string }[]).some((a) => a.team_member_id === member.id));
            const mCompleted = mTasks.filter((t) => t.status === "completed");
            const mOverdue = mTasks.filter((t) => t.overdue);
            const mPaused = mTasks.filter((t) => t.status === "paused");
            const mInProgress = mTasks.filter((t) => t.status === "in progress");
            const mEst = mTasks.reduce((s, t) => s + t.estimated_hours, 0);
            const mAct = mTasks.reduce((s, t) => s + t.actual_hours, 0);
            const onTimeCount = mCompleted.filter((t) => t.actual_hours <= t.estimated_hours * 1.1).length;
            const onTimeRate = mCompleted.length > 0 ? Math.round((onTimeCount / mCompleted.length) * 100) : 0;
            const catBreakdown = Object.entries(
              mTasks.reduce((acc, t) => { acc[t.category] = (acc[t.category] ?? 0) + 1; return acc; }, {} as Record<string, number>)
            ).map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));

            return (
              <div className="space-y-6">
                {/* Developer picker */}
                <div className="card-lg p-5">
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Select Developer</label>
                      <select
                        className="input-base w-56"
                        value={selectedMemberId || member.id}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                      >
                        {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 grid grid-cols-5 gap-3">
                      {[
                        { label: "Assigned", value: mTasks.length, color: "#6366F1" },
                        { label: "Completed", value: mCompleted.length, color: "#10B981" },
                        { label: "In Progress", value: mInProgress.length, color: "#F59E0B" },
                        { label: "Paused", value: mPaused.length, color: "#64748B" },
                        { label: "Overdue", value: mOverdue.length, color: "#EF4444" },
                      ].map((s) => (
                        <div key={s.label} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <div className="text-[20px] font-semibold" style={{ color: s.color }}>{s.value}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-5">
                  {/* Hours chart */}
                  <div className="card-lg p-5 col-span-2">
                    <SectionTitle>Hours: Estimated vs Actual</SectionTitle>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {[
                        { label: "Est. Hours", value: `${mEst.toFixed(1)}h`, color: "#6366F1" },
                        { label: "Actual Hours", value: `${mAct.toFixed(1)}h`, color: mAct > mEst ? "#EF4444" : "#10B981" },
                        { label: "On-Time Rate", value: `${onTimeRate}%`, color: onTimeRate >= 70 ? "#10B981" : "#F59E0B" },
                      ].map((s) => (
                        <div key={s.label} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <div className="text-[20px] font-semibold" style={{ color: s.color }}>{s.value}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart data={mTasks.slice(0, 10).map((t) => ({ name: t.name.split(" ")[0], est: t.estimated_hours, act: t.actual_hours }))} margin={{ left: -20, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="est" fill="#E0E7FF" radius={[3, 3, 0, 0]} name="Estimated" />
                        <Bar dataKey="act" fill="#6366F1" radius={[3, 3, 0, 0]} name="Actual" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Category breakdown */}
                  <div className="card-lg p-5">
                    <SectionTitle>By Category</SectionTitle>
                    <ResponsiveContainer width="100%" height={130}>
                      <PieChart>
                        <Pie data={catBreakdown} cx="50%" cy="50%" innerRadius={32} outerRadius={56} paddingAngle={3} dataKey="value">
                          {catBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {catBreakdown.map((c) => (
                        <div key={c.name} className="flex items-center gap-1 text-[10.5px] text-gray-500">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                          <span className="capitalize">{c.name} ({c.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Task list */}
                <div className="card-lg overflow-hidden">
                  <SectionTitle>
                    <span className="px-5 pt-5 block">Tasks Assigned to {member.full_name}</span>
                  </SectionTitle>
                  <table>
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Est. Hours</th>
                        <th>Actual Hours</th>
                        <th>Variance</th>
                        <th>Due</th>
                        <th>Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mTasks.map((t) => {
                        const variance = t.actual_hours - t.estimated_hours;
                        return (
                          <tr key={t.id}>
                            <td>
                              <div className="font-medium">{t.name}</div>
                              {t.category && <div className="text-[11px] text-gray-400 capitalize">{t.category}</div>}
                            </td>
                            <td><StatusBadge status={t.status} /></td>
                            <td><PriorityBadge priority={t.priority} /></td>
                            <td className="text-[13px]">{formatHours(t.estimated_hours)}</td>
                            <td className="text-[13px]">{formatHours(t.actual_hours)}</td>
                            <td className={`text-[13px] font-medium ${variance > 0 ? "text-red-500" : "text-emerald-600"}`}>
                              {variance > 0 ? `+${variance}h` : `${variance}h`}
                            </td>
                            <td className="text-[12.5px]">{t.expected_end ? formatDate(t.expected_end) : "—"}</td>
                            <td className="text-[12.5px]">{t.actual_end ? formatDate(t.actual_end) : "—"}</td>
                          </tr>
                        );
                      })}
                      {mTasks.length === 0 && (
                        <tr><td colSpan={8} className="text-center text-gray-400 text-[13px] py-6">No tasks assigned.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Team Performance (shown always) */}
          {(reportType === "team" || reportType === "weekly") && (
            <div className="card-lg p-5">
              <SectionTitle>Team Performance Summary</SectionTitle>
              <div className="mb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={memberPerf} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="full_name" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} tickLine={false} axisLine={false} tickFormatter={(v) => v.split(" ")[0]} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="mEst" fill="#E0E7FF" radius={[4, 4, 0, 0]} name="Est. Hours" />
                    <Bar dataKey="mAct" fill="#6366F1" radius={[4, 4, 0, 0]} name="Actual Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Developer</th>
                    <th>Role</th>
                    <th>Tasks Assigned</th>
                    <th>Completed</th>
                    <th>Overdue</th>
                    <th>Est. Hours</th>
                    <th>Actual Hours</th>
                    <th>Variance</th>
                    <th>On-Time Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {memberPerf.map((m) => {
                    const variance = m.mAct - m.mEst;
                    const rate = m.mCompleted > 0 ? Math.round(((m.mCompleted - m.mOverdue) / m.mCompleted) * 100) : 0;
                    return (
                      <tr key={m.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <Avatar name={m.full_name} size="xs" />
                            <span className="font-medium">{m.full_name}</span>
                          </div>
                        </td>
                        <td className="text-[12.5px]">{m.title}</td>
                        <td className="text-center font-medium">{m.mTasks}</td>
                        <td className="text-center text-emerald-600 font-medium">{m.mCompleted}</td>
                        <td className="text-center text-red-500 font-medium">{m.mOverdue}</td>
                        <td className="text-[13px]">{formatHours(m.mEst)}</td>
                        <td className="text-[13px]">{formatHours(m.mAct)}</td>
                        <td className={`text-[13px] font-medium ${variance > 0 ? "text-red-500" : "text-emerald-600"}`}>
                          {variance > 0 ? `+${variance}h` : `${variance}h`}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <ProgressBar value={rate} className="w-16" />
                            <span className="text-[12px] font-medium">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Client Report */}
          {(reportType === "client" || reportType === "weekly") && (
            <div className="card-lg p-5">
              <SectionTitle>Client Health Overview</SectionTitle>
              <div className="mb-4">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={clientHealth} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} tickLine={false} axisLine={false} tickFormatter={(v) => v.split(" ")[0]} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="projects" fill="#6366F1" radius={[4, 4, 0, 0]} name="Active Projects" />
                    <Bar dataKey="overdue" fill="#EF4444" radius={[4, 4, 0, 0]} name="Overdue Tasks" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Active Projects</th>
                    <th>Overdue Tasks</th>
                    <th>Next Deadline</th>
                    <th>Waiting Update</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>{c.company_name}</div>
                      </td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>
                        <span className={`badge ${c.priority === "critical" ? "bg-red-50 text-red-700" : c.priority === "high" ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-600"} capitalize`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="text-center font-medium">{c.active_projects ?? 0}</td>
                      <td className={`text-center font-medium ${(c.overdue_tasks ?? 0) > 0 ? "text-red-500" : "text-emerald-600"}`}>{c.overdue_tasks ?? 0}</td>
                      <td className="text-[12.5px]">{c.next_deadline ? formatDate(c.next_deadline) : "—"}</td>
                      <td>
                        <span className={`badge ${c.waiting_for_update ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {c.waiting_for_update ? "Waiting" : "Up to date"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Project Report */}
          {(reportType === "project" || reportType === "weekly") && (
            <div className="card-lg p-5">
              <SectionTitle>Project Status Report</SectionTitle>
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Health</th>
                    <th>Progress</th>
                    <th>Est. Hours</th>
                    <th>Actual Hours</th>
                    <th>Variance</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => {
                    const variance = p.actual_hours - p.estimated_hours;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="font-medium">{p.name}</div>
                          {p.category && <div className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>{p.category}</div>}
                        </td>
                        <td className="text-[13px]">{(p.client as { name: string } | undefined)?.name ?? "—"}</td>
                        <td><StatusBadge status={p.status} /></td>
                        <td>
                          <span className={`badge capitalize ${p.health_status === "healthy" ? "bg-emerald-50 text-emerald-700" : p.health_status === "at risk" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                            {p.health_status}
                          </span>
                        </td>
                        <td style={{ minWidth: 120 }}>
                          <ProgressBar value={p.progress_percent} showLabel />
                        </td>
                        <td className="text-[13px]">{formatHours(p.estimated_hours)}</td>
                        <td className="text-[13px]">{formatHours(p.actual_hours)}</td>
                        <td className={`text-[13px] font-medium ${variance > 0 ? "text-red-500" : "text-emerald-600"}`}>
                          {variance > 0 ? `+${variance}h` : `${variance}h`}
                        </td>
                        <td className="text-[12.5px]">{p.due_date ? formatDate(p.due_date) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
