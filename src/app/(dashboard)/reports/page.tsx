"use client";
import { useState, useRef } from "react";
import TopBar from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import ProgressBar from "@/components/ui/ProgressBar";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import { useTeamMembers } from "@/lib/hooks/useTeam";
import { useClients } from "@/lib/hooks/useClients";
import { useProjects } from "@/lib/hooks/useProjects";
import { useTasks } from "@/lib/hooks/useTasks";
import { formatDate, formatDateTime, formatHours } from "@/lib/utils";
import type { Task } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { Download, BarChart3, Users, FolderKanban, Calendar, Printer, Building2, CheckSquare } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { Workbook } from "exceljs";

const CHART_COLORS = ["#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#0EA5E9"];

type ReportType = "individual" | "team" | "client" | "project" | "weekly";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function taskReferenceDate(t: Task): Date {
  const raw = t.actual_end || t.actual_start || t.expected_end || t.expected_start || t.created_at;
  return new Date(raw);
}

function isTaskInRange(t: Task, start: string, end: string): boolean {
  const ref = taskReferenceDate(t);
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T23:59:59`);
  return ref >= startDate && ref <= endDate;
}

async function loadLogoPngDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/logo.webp");
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

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

  const today = new Date();
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportGenerating, setExportGenerating] = useState(false);
  const [exportStart, setExportStart] = useState(isoDate(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [exportEnd, setExportEnd] = useState(isoDate(today));

  const loading = ml || cl || pl || tl;

  // Computed metrics
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const overdueTasks = tasks.filter((t) => t.overdue);

  function computeMemberPerf(taskList: Task[]) {
    return members.map((m) => {
      const mTasks = taskList.filter((t) => ((t.assignments ?? []) as { team_member_id: string }[]).some((a) => a.team_member_id === m.id));
      const mCompleted = mTasks.filter((t) => t.status === "completed").length;
      const mOverdue = mTasks.filter((t) => t.overdue).length;
      const mEst = mTasks.reduce((s, t) => s + t.estimated_hours, 0);
      const mAct = mTasks.reduce((s, t) => s + t.actual_hours, 0);
      return { ...m, mTasks: mTasks.length, mCompleted, mOverdue, mEst, mAct, taskList: mTasks };
    }).sort((a, b) => b.mCompleted - a.mCompleted);
  }

  const memberPerf = computeMemberPerf(tasks);

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

  function exportTeamReportPDF(filteredTasks: Task[], perf: ReturnType<typeof computeMemberPerf>, start: string, end: string, logoDataUrl: string | null) {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 42;

    const periodLabel = `${formatDate(new Date(`${start}T00:00:00`))} – ${formatDate(new Date(`${end}T00:00:00`))}`;

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", margin, y - 22, 30, 30);
    }
    const textX = logoDataUrl ? margin + 40 : margin;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(20, 20, 20);
    doc.text("IntegritiMS", textX, y - 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(90, 90, 90);
    doc.text("Team Performance Report", textX, y + 9);
    y += 32;

    doc.setDrawColor(228, 228, 228);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);
    doc.text(`Report Period: ${periodLabel}`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(130, 130, 130);
    doc.text(`Generated: ${formatDateTime(new Date())}`, pageWidth - margin, y, { align: "right" });
    y += 22;

    const completed = filteredTasks.filter((t) => t.status === "completed");
    const overdue = filteredTasks.filter((t) => t.overdue);
    const onTimeOverall = completed.length > 0
      ? Math.round((completed.filter((t) => t.actual_hours <= t.estimated_hours * 1.1).length / completed.length) * 100)
      : 0;
    const healthy = projects.filter((p) => p.health_status === "healthy").length;
    const atRisk = projects.filter((p) => p.health_status === "at risk").length;
    const critical = projects.filter((p) => p.health_status === "critical").length;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text("Summary", margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 7, halign: "center", textColor: [20, 20, 20] },
      head: [["Assigned Tasks", "Completed", "Overdue", "Efficiency (On-Time)", "Project Health (Healthy / At Risk / Critical)"]],
      body: [[
        String(filteredTasks.length),
        String(completed.length),
        String(overdue.length),
        `${onTimeOverall}%`,
        `${healthy} / ${atRisk} / ${critical}`,
      ]],
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
      bodyStyles: { fontStyle: "bold" },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text("Project health reflects current status and is not limited to the selected period.", margin, y);
    y += 22;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text("Developer Performance Overview", margin, y);
    y += 6;

    const devRows = perf.map((m) => {
      const variance = m.mAct - m.mEst;
      const rate = m.mCompleted > 0 ? Math.round(((m.mCompleted - m.mOverdue) / m.mCompleted) * 100) : 0;
      return [
        m.full_name,
        m.title ?? "—",
        String(m.mTasks),
        String(m.mCompleted),
        String(m.mOverdue),
        `${m.mEst}h`,
        `${m.mAct}h`,
        variance > 0 ? `+${variance.toFixed(1)}h` : `${variance.toFixed(1)}h`,
        `${rate}%`,
      ];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8.5, cellPadding: 5.5 },
      head: [["Developer", "Role", "Assigned", "Completed", "Overdue", "Est Hrs", "Act Hrs", "Variance", "On-Time"]],
      body: devRows,
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 249, 251] },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 7) {
          const raw = String(data.cell.raw ?? "");
          data.cell.styles.textColor = raw.startsWith("+") ? [220, 38, 38] : [5, 150, 105];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 28;

    // ── Per-developer task breakdown & variance ──
    perf.forEach((m) => {
      if (y > pageHeight - 150) {
        doc.addPage();
        y = 48;
      }

      doc.setFillColor(243, 244, 246);
      doc.rect(margin, y - 14, pageWidth - margin * 2, 24, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(20, 20, 20);
      doc.text(m.full_name, margin + 8, y + 2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(110, 110, 110);
      doc.text(`${m.title ?? "—"}  ·  ${m.mTasks} task${m.mTasks === 1 ? "" : "s"} in period`, pageWidth - margin - 8, y + 2, { align: "right" });
      y += 22;

      const rows = m.taskList.map((t) => {
        const variance = t.actual_hours - t.estimated_hours;
        return [t.name, t.status, t.priority, `${t.estimated_hours}h`, `${t.actual_hours}h`, variance > 0 ? `+${variance}h` : `${variance}h`];
      });

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 4.5 },
        head: [["Task", "Status", "Priority", "Est", "Act", "Variance"]],
        body: rows.length ? rows : [["No tasks in this period", "—", "—", "—", "—", "—"]],
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 249, 251] },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 5) {
            const raw = String(data.cell.raw ?? "");
            if (raw.startsWith("+")) data.cell.styles.textColor = [220, 38, 38];
            else if (raw !== "—") data.cell.styles.textColor = [5, 150, 105];
            data.cell.styles.fontStyle = "bold";
          }
        },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 26;
    });

    if (y > pageHeight - 150) {
      doc.addPage();
      y = 48;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text("Estimated vs Actual Hours Summary", margin, y);
    y += 6;

    const hoursRows = perf
      .slice()
      .sort((a, b) => (b.mAct - b.mEst) - (a.mAct - a.mEst))
      .map((m) => {
        const variance = m.mAct - m.mEst;
        const utilization = m.mEst > 0 ? Math.round((m.mAct / m.mEst) * 100) : 0;
        return [
          m.full_name,
          `${m.mEst}h`,
          `${m.mAct}h`,
          variance > 0 ? `+${variance.toFixed(1)}h` : `${variance.toFixed(1)}h`,
          `${utilization}%`,
        ];
      });

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 5.5 },
      head: [["Developer", "Estimated Hours", "Actual Hours", "Variance", "Utilization"]],
      body: hoursRows,
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 249, 251] },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 3) {
          const raw = String(data.cell.raw ?? "");
          data.cell.styles.textColor = raw.startsWith("+") ? [220, 38, 38] : [5, 150, 105];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`IntegritiMS · Team Performance Report · ${periodLabel} · Page ${i} of ${pageCount}`, margin, pageHeight - 20);
      doc.text(formatDate(new Date(), "yyyy-MM-dd"), pageWidth - margin, pageHeight - 20, { align: "right" });
    }

    doc.save(`IntegritiMS-team-report-${start}_to_${end}.pdf`);
  }

  async function exportTeamTasksWorkbook(filteredTasks: Task[], perf: ReturnType<typeof computeMemberPerf>, start: string, end: string, logoDataUrl: string | null) {
    const workbook = new Workbook();
    workbook.creator = "IntegritiMS";
    workbook.created = new Date();

    const periodLabel = `${formatDate(new Date(`${start}T00:00:00`))} – ${formatDate(new Date(`${end}T00:00:00`))}`;
    const generatedLabel = formatDateTime(new Date());

    // ── Summary sheet ──
    const summary = workbook.addWorksheet("Summary");
    summary.columns = [
      { key: "a", width: 24 }, { key: "b", width: 16 }, { key: "c", width: 12 },
      { key: "d", width: 12 }, { key: "e", width: 12 }, { key: "f", width: 12 },
      { key: "g", width: 12 }, { key: "h", width: 12 }, { key: "i", width: 12 },
    ];

    if (logoDataUrl) {
      const imageId = workbook.addImage({ base64: logoDataUrl.split(",")[1], extension: "png" });
      summary.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 40, height: 40 } });
    }
    summary.mergeCells("B1:E1");
    summary.getCell("B1").value = "IntegritiMS — Team Performance Report";
    summary.getCell("B1").font = { bold: true, size: 14 };
    summary.mergeCells("B2:E2");
    summary.getCell("B2").value = `Period: ${periodLabel}`;
    summary.getCell("B2").font = { size: 10, color: { argb: "FF6B7280" } };
    summary.mergeCells("B3:E3");
    summary.getCell("B3").value = `Generated: ${generatedLabel}`;
    summary.getCell("B3").font = { size: 10, color: { argb: "FF6B7280" } };

    const summaryHeaderRow = summary.getRow(5);
    summaryHeaderRow.values = ["Developer", "Role", "Assigned", "Completed", "Overdue", "Est Hrs", "Act Hrs", "Variance", "On-Time"];
    summaryHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    summaryHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };

    perf.forEach((m, i) => {
      const variance = m.mAct - m.mEst;
      const rate = m.mCompleted > 0 ? Math.round(((m.mCompleted - m.mOverdue) / m.mCompleted) * 100) : 0;
      const row = summary.getRow(6 + i);
      row.values = [m.full_name, m.title ?? "—", m.mTasks, m.mCompleted, m.mOverdue, m.mEst, m.mAct, variance, rate / 100];
      row.getCell(8).font = { bold: true, color: { argb: variance > 0 ? "FFDC2626" : "FF059669" } };
      row.getCell(9).numFmt = "0%";
    });
    summary.views = [{ state: "frozen", ySplit: 5 }];

    // ── Per-developer sheets ──
    const usedNames = new Set<string>();
    perf.forEach((m) => {
      let sheetName = m.full_name.replace(/[\\/*?:[\]]/g, "").trim().slice(0, 31) || "Developer";
      if (usedNames.has(sheetName)) {
        let suffix = 2;
        while (usedNames.has(`${sheetName.slice(0, 28)} (${suffix})`)) suffix++;
        sheetName = `${sheetName.slice(0, 28)} (${suffix})`;
      }
      usedNames.add(sheetName);

      const sheet = workbook.addWorksheet(sheetName);
      sheet.columns = [
        { key: "task", width: 38 },
        { key: "status", width: 16 },
        { key: "priority", width: 12 },
        { key: "est", width: 14 },
        { key: "act", width: 14 },
        { key: "variance", width: 14 },
      ];

      sheet.mergeCells("A1:F1");
      sheet.getCell("A1").value = `${m.full_name} — ${m.title ?? "—"}`;
      sheet.getCell("A1").font = { bold: true, size: 13 };
      sheet.mergeCells("A2:F2");
      sheet.getCell("A2").value = `Period: ${periodLabel}`;
      sheet.getCell("A2").font = { size: 9.5, color: { argb: "FF6B7280" } };

      const headerRow = sheet.getRow(4);
      headerRow.values = ["Task Name", "Status", "Priority", "Est Time (h)", "Act Time (h)", "Variance (h)"];
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
      headerRow.alignment = { vertical: "middle" };

      if (m.taskList.length === 0) {
        sheet.getRow(5).values = ["No tasks in this period", "", "", "", "", ""];
      } else {
        m.taskList.forEach((t, idx) => {
          const variance = t.actual_hours - t.estimated_hours;
          const row = sheet.getRow(5 + idx);
          row.values = [t.name, t.status, t.priority, t.estimated_hours, t.actual_hours, variance];
          row.getCell(6).font = { bold: true, color: { argb: variance > 0 ? "FFDC2626" : "FF059669" } };
        });
      }

      sheet.getColumn(1).alignment = { wrapText: true, vertical: "middle" };
      sheet.views = [{ state: "frozen", ySplit: 4 }];
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IntegritiMS-team-tasks-by-developer-${start}_to_${end}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function exportScreenshotPDF() {
    const el = reportRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 1.5, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width / 1.5, canvas.height / 1.5] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 1.5, canvas.height / 1.5);
    pdf.save(`IntegritiMS-${reportType}-report-${formatDate(new Date(), "yyyy-MM-dd")}.pdf`);
  }

  function exportPDF() {
    if (reportType === "team") {
      setShowExportModal(true);
      return;
    }
    void exportScreenshotPDF();
  }

  async function handleGenerateTeamExport() {
    if (!exportStart || !exportEnd || exportStart > exportEnd) return;
    setExportGenerating(true);
    try {
      const filteredTasks = tasks.filter((t) => isTaskInRange(t, exportStart, exportEnd));
      const perf = computeMemberPerf(filteredTasks);
      const logoDataUrl = await loadLogoPngDataUrl();
      exportTeamReportPDF(filteredTasks, perf, exportStart, exportEnd, logoDataUrl);
      await exportTeamTasksWorkbook(filteredTasks, perf, exportStart, exportEnd, logoDataUrl);
      setShowExportModal(false);
    } finally {
      setExportGenerating(false);
    }
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
            <button
              className="btn btn-primary"
              style={{ height: 36, fontSize: 13, gap: 6 }}
              onClick={exportPDF}
              title={reportType === "team" ? "Downloads the team PDF report plus an Excel workbook (one sheet per developer)" : "Download PDF report"}
            >
              <Download size={14} /> {reportType === "team" ? "Export PDF + Excel" : "Export PDF"}
            </button>
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
                            <ProgressBar value={rate} className="w-20" />
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

      <Modal
        open={showExportModal}
        onClose={() => !exportGenerating && setShowExportModal(false)}
        title="Export Team Report"
        subtitle="Choose the date range to include in the PDF and Excel export."
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" style={{ height: 36, fontSize: 13 }} onClick={() => setShowExportModal(false)} disabled={exportGenerating}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              style={{ height: 36, fontSize: 13, gap: 6 }}
              onClick={handleGenerateTeamExport}
              disabled={exportGenerating || !exportStart || !exportEnd || exportStart > exportEnd}
            >
              <Download size={14} /> {exportGenerating ? "Generating…" : "Generate Report"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 6, display: "block" }}>
              Start Date
            </label>
            <input
              type="date"
              className="input-base"
              style={{ width: "100%", height: 38 }}
              value={exportStart}
              max={exportEnd || undefined}
              onChange={(e) => setExportStart(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 6, display: "block" }}>
              End Date
            </label>
            <input
              type="date"
              className="input-base"
              style={{ width: "100%", height: 38 }}
              value={exportEnd}
              min={exportStart || undefined}
              onChange={(e) => setExportEnd(e.target.value)}
            />
          </div>
          {exportStart && exportEnd && exportStart > exportEnd && (
            <div style={{ fontSize: 12, color: "#DC2626", fontWeight: 600 }}>Start date must be before end date.</div>
          )}
          <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", lineHeight: 1.5 }}>
            Includes all tasks with activity in this window, a developer performance overview, a per-developer task &amp; variance breakdown, and an estimated vs. actual hours summary — plus a companion Excel workbook with one sheet per developer.
          </div>
        </div>
      </Modal>
    </>
  );
}
