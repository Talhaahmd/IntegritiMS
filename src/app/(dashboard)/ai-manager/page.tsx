"use client";
import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import Avatar from "@/components/ui/Avatar";
import ProgressBar from "@/components/ui/ProgressBar";
import { useTeamMembers } from "@/lib/hooks/useTeam";
import { useClients } from "@/lib/hooks/useClients";
import { useProjects } from "@/lib/hooks/useProjects";
import { useTasks } from "@/lib/hooks/useTasks";
import { formatDate, formatHours } from "@/lib/utils";
import { createClient as createSBClient } from "@/lib/supabase/client";
import {
  Sparkles, RefreshCw, AlertTriangle, TrendingUp, User, FolderKanban,
  Lightbulb, CheckCircle2, Clock, ArrowRight, Zap, ChevronDown, ChevronUp,
  History, Download, AlertCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CriticalAction { severity: "high" | "medium" | "low"; text: string }
interface DeveloperInsight {
  name: string;
  tasks_completed: number;
  tasks_delayed: number;
  tasks_in_progress: number;
  on_time_rate: number;
  est_hours: number;
  actual_hours: number;
  performance_label: "Excellent" | "Good" | "Average" | "Needs Improvement";
  strengths: string[];
  improvements: string[];
  workload_status: "Overloaded" | "Balanced" | "Underutilized";
}
interface ProjectEntry { name: string; note: string }
interface Recommendation { priority: "immediate" | "soon" | "consider"; action: string; rationale: string }

interface AIReport {
  critical_actions: CriticalAction[];
  team_performance: {
    headline: string;
    on_time_rate: number;
    top_performers: string[];
    needs_attention: string[];
    efficiency_trend: "improving" | "stable" | "declining";
    trend_note: string;
  };
  developer_insights: DeveloperInsight[];
  project_health: {
    healthy: ProjectEntry[];
    at_risk: ProjectEntry[];
    critical: ProjectEntry[];
  };
  recommendations: Recommendation[];
  executive_summary: string;
}

interface SavedReport {
  id: string;
  title: string;
  content: AIReport;
  generated_at: string;
  tokens_used: number | null;
}

// ── Helper Components ──────────────────────────────────────────────────────────

function SeverityDot({ severity }: { severity: string }) {
  const color = severity === "high" ? "bg-red-500" : severity === "medium" ? "bg-amber-400" : "bg-blue-400";
  return <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${color}`} />;
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles = {
    immediate: "bg-red-50 text-red-700 border-red-100",
    soon: "bg-amber-50 text-amber-700 border-amber-100",
    consider: "bg-blue-50 text-blue-700 border-blue-100",
  }[priority] ?? "bg-gray-50 text-gray-600 border-gray-100";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold uppercase tracking-wide border ${styles}`}>
      {priority}
    </span>
  );
}

function PerfBadge({ label }: { label: string }) {
  const styles: Record<string, string> = {
    Excellent: "bg-emerald-50 text-emerald-700",
    Good: "bg-blue-50 text-blue-700",
    Average: "bg-amber-50 text-amber-700",
    "Needs Improvement": "bg-red-50 text-red-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${styles[label] ?? "bg-gray-50 text-gray-600"}`}>
      {label}
    </span>
  );
}

function WorkloadBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Overloaded: "text-red-600 bg-red-50",
    Balanced: "text-emerald-600 bg-emerald-50",
    Underutilized: "text-amber-600 bg-amber-50",
  };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${styles[status] ?? "bg-gray-50 text-gray-600"}`}>
      {status}
    </span>
  );
}

function SectionHeader({ icon: Icon, title, color = "text-gray-700" }: { icon: React.ElementType; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <Icon size={16} className={color} />
      <h2 className="text-[14px] font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AIManagerPage() {
  const { data: members, loading: ml } = useTeamMembers();
  const { data: clients, loading: cl } = useClients();
  const { data: projects, loading: pl } = useProjects();
  const { data: tasks, loading: tl } = useTasks();
  const loading = ml || cl || pl || tl;

  const [report, setReport] = useState<AIReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [tokensUsed, setTokensUsed] = useState(0);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedDev, setExpandedDev] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    const { data } = await createSBClient()
      .from("ai_reports")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(10);
    setSavedReports((data as SavedReport[]) ?? []);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  function buildPayload() {
    return {
      generated_at: new Date().toISOString(),
      summary: {
        total_clients: clients.length,
        active_clients: clients.filter((c) => c.status === "active").length,
        clients_waiting_update: clients.filter((c) => c.waiting_for_update).length,
        total_projects: projects.length,
        active_projects: projects.filter((p) => ["active", "in progress"].includes(p.status)).length,
        total_tasks: tasks.length,
        completed_tasks: tasks.filter((t) => t.status === "completed").length,
        in_progress_tasks: tasks.filter((t) => t.status === "in progress").length,
        paused_tasks: tasks.filter((t) => t.status === "paused").length,
        overdue_tasks: tasks.filter((t) => t.overdue).length,
        delayed_tasks: tasks.filter((t) => t.status === "delayed").length,
        total_team: members.length,
        fully_booked: members.filter((m) => m.availability_status === "fully booked").length,
      },
      clients: clients.map((c) => ({
        name: c.name,
        company: c.company_name,
        status: c.status,
        priority: c.priority,
        active_projects: c.active_projects ?? 0,
        overdue_tasks: c.overdue_tasks ?? 0,
        waiting_for_update: c.waiting_for_update,
        next_deadline: c.next_deadline,
      })),
      projects: projects.map((p) => ({
        name: p.name,
        client: (p.client as { name: string } | undefined)?.name ?? "—",
        status: p.status,
        priority: p.priority,
        health: p.health_status,
        progress: p.progress_percent,
        estimated_hours: p.estimated_hours,
        actual_hours: p.actual_hours,
        due_date: p.due_date,
        category: p.category,
      })),
      tasks: tasks.map((t) => ({
        name: t.name,
        status: t.status,
        priority: t.priority,
        category: t.category,
        overdue: t.overdue,
        estimated_hours: t.estimated_hours,
        actual_hours: t.actual_hours,
        variance: t.actual_hours - t.estimated_hours,
        expected_end: t.expected_end,
        client: (t.client as { name: string } | undefined)?.name,
        project: (t.project as { name: string } | undefined)?.name,
        assignees: ((t.assignments ?? []) as { team_members?: { full_name: string }; estimated_hours?: number; actual_hours?: number; status?: string }[]).map((a) => ({
          name: a.team_members?.full_name,
          estimated_hours: a.estimated_hours,
          actual_hours: a.actual_hours,
          status: a.status,
        })).filter((a) => a.name),
      })),
      team: members.map((m) => ({
        name: m.full_name,
        title: m.title,
        primary_skill: m.primary_skill,
        experience: m.experience_level,
        availability: m.availability_status,
        active_tasks: m.active_tasks ?? 0,
        completed_tasks: m.completed_tasks ?? 0,
        delayed_tasks: m.delayed_tasks ?? 0,
        total_assigned_hours: m.total_assigned_hours ?? 0,
        actual_worked_hours: (m as Record<string, unknown>).actual_worked_hours ?? 0,
        on_time_rate: m.on_time_rate ?? 0,
      })),
    };
  }

  async function generateReport() {
    setGenerating(true);
    setError("");
    try {
      const payload = buildPayload();
      const res = await fetch("/api/ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to generate report");

      setReport(json.report as AIReport);
      setTokensUsed(json.tokens ?? 0);

      // Save to DB
      await createSBClient().from("ai_reports").insert({
        report_type: "full",
        title: `Operations Report — ${formatDate(new Date(), "MMM d, yyyy")}`,
        content: json.report,
        tokens_used: json.tokens ?? 0,
      });
      loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setGenerating(false);
    }
  }

  function loadSaved(saved: SavedReport) {
    setReport(saved.content);
    setTokensUsed(saved.tokens_used ?? 0);
    setShowHistory(false);
  }

  if (loading) return (
    <>
      <TopBar title="AI Manager" />
      <PageLoader />
    </>
  );

  return (
    <>
      <TopBar title="AI Manager" subtitle="Powered by GPT-4o" />

      <div className="p-8 animate-fade-in max-w-[1200px]">

        {/* Hero Generate Bar */}
        <div className="card-lg p-6 mb-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <Sparkles size={22} color="white" />
          </div>
          <div className="flex-1">
            <h2 className="text-[16px] font-semibold text-gray-900">AI Operations Report</h2>
            <p className="text-[12.5px] text-gray-400 mt-0.5">
              Analyzes all {clients.length} clients, {projects.length} projects, {tasks.length} tasks, and {members.length} developers. Generates critical actions, performance insights, and recommendations.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {savedReports.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowHistory((v) => !v)}
              >
                <History size={13} />
                History ({savedReports.length})
              </button>
            )}
            <button
              className="btn btn-primary flex items-center gap-2"
              onClick={generateReport}
              disabled={generating}
            >
              {generating ? (
                <><RefreshCw size={14} className="animate-spin" /> Analyzing…</>
              ) : (
                <><Sparkles size={14} /> Generate Report</>
              )}
            </button>
          </div>
        </div>

        {/* Report History */}
        {showHistory && savedReports.length > 0 && (
          <div className="card-lg p-4 mb-6">
            <div className="text-[12px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Past Reports</div>
            <div className="space-y-1.5">
              {savedReports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => loadSaved(r)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all text-left"
                >
                  <div>
                    <div className="text-[13px] font-medium text-gray-800">{r.title}</div>
                    <div className="text-[11.5px] text-gray-400">{formatDate(r.generated_at)} · {r.tokens_used ?? "—"} tokens</div>
                  </div>
                  <ArrowRight size={13} className="text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 mb-5 text-[13px] text-red-700">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            {error}
          </div>
        )}

        {/* Generating skeleton */}
        {generating && (
          <div className="space-y-4">
            {[300, 200, 250, 180].map((w, i) => (
              <div key={i} className="card-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-48 mb-4" />
                <div className="space-y-2">
                  {[w, w - 60, w + 40].map((width, j) => (
                    <div key={j} className="h-3 bg-gray-100 rounded" style={{ width }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Report */}
        {report && !generating && (
          <div className="space-y-5">
            {/* Tokens badge */}
            {tokensUsed > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-gray-400">
                  <span className="text-gray-600 font-medium">GPT-4o</span> · {tokensUsed.toLocaleString()} tokens · {formatDate(new Date())}
                </p>
                <button
                  className="btn btn-ghost btn-sm text-gray-400"
                  onClick={generateReport}
                >
                  <RefreshCw size={12} /> Regenerate
                </button>
              </div>
            )}

            {/* Executive Summary */}
            {report.executive_summary && (
              <div className="card-lg p-5 border-l-4 border-indigo-400 bg-indigo-50/30">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-indigo-500" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-400">Executive Summary</span>
                </div>
                <p className="text-[14px] text-gray-700 leading-relaxed">{report.executive_summary}</p>
              </div>
            )}

            {/* Critical Actions */}
            <div className="card-lg p-5">
              <SectionHeader icon={AlertTriangle} title="Critical Actions" color="text-red-500" />
              {report.critical_actions.length === 0 ? (
                <div className="flex items-center gap-2 text-[13px] text-emerald-600">
                  <CheckCircle2 size={15} /> No critical actions — all systems healthy.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {report.critical_actions.map((a, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
                      a.severity === "high" ? "bg-red-50 border-red-100" :
                      a.severity === "medium" ? "bg-amber-50 border-amber-100" :
                      "bg-blue-50 border-blue-100"
                    }`}>
                      <SeverityDot severity={a.severity} />
                      <p className="text-[13px] text-gray-800 leading-relaxed">{a.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team Performance */}
            <div className="card-lg p-5">
              <SectionHeader icon={TrendingUp} title="Team Performance" color="text-indigo-500" />
              <div className="flex items-center gap-4 mb-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex-1">
                  <div className="text-[12px] text-gray-400 mb-1">Agency On-Time Rate</div>
                  <ProgressBar value={report.team_performance.on_time_rate} showLabel size="md" />
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                    report.team_performance.efficiency_trend === "improving" ? "bg-emerald-50 text-emerald-700" :
                    report.team_performance.efficiency_trend === "declining" ? "bg-red-50 text-red-700" :
                    "bg-amber-50 text-amber-700"
                  }`}>
                    {report.team_performance.efficiency_trend === "improving" ? "↑" :
                     report.team_performance.efficiency_trend === "declining" ? "↓" : "→"} {report.team_performance.efficiency_trend}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">{report.team_performance.trend_note}</div>
                </div>
              </div>
              <p className="text-[13.5px] text-gray-600 mb-4">{report.team_performance.headline}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 mb-2">Top Performers</div>
                  {report.team_performance.top_performers.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 mb-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-[12.5px] text-gray-700">{p}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 mb-2">Needs Attention</div>
                  {report.team_performance.needs_attention.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 mb-1.5">
                      <AlertCircle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-[12.5px] text-gray-700">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Individual Developer Insights */}
            <div className="card-lg p-5">
              <SectionHeader icon={User} title="Developer Insights" color="text-violet-500" />
              <div className="space-y-2.5">
                {report.developer_insights.map((dev, i) => {
                  const isExpanded = expandedDev === dev.name;
                  const member = members.find((m) => m.full_name === dev.name || m.full_name.toLowerCase().includes(dev.name.toLowerCase().split(" ")[0]));
                  return (
                    <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                      {/* Row header */}
                      <button
                        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                        onClick={() => setExpandedDev(isExpanded ? null : dev.name)}
                      >
                        {member ? (
                          <Avatar name={member.full_name} size="sm" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-bold text-indigo-600 shrink-0">
                            {dev.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[13.5px] font-semibold text-gray-900">{dev.name}</span>
                            <PerfBadge label={dev.performance_label} />
                            <WorkloadBadge status={dev.workload_status} />
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11.5px] text-gray-400">
                            <span>✓ {dev.tasks_completed} done</span>
                            {dev.tasks_delayed > 0 && <span className="text-red-500">⚠ {dev.tasks_delayed} delayed</span>}
                            {dev.tasks_in_progress > 0 && <span>⏳ {dev.tasks_in_progress} active</span>}
                            <span>{dev.on_time_rate}% on-time</span>
                            <span>{dev.est_hours}h est / {dev.actual_hours}h actual</span>
                          </div>
                        </div>
                        <div className="text-gray-400 shrink-0">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50/60">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 mb-2">Strengths</div>
                              {dev.strengths.map((s, j) => (
                                <div key={j} className="flex items-start gap-1.5 mb-1.5">
                                  <span className="text-emerald-500 mt-0.5 text-[11px] shrink-0">+</span>
                                  <span className="text-[12.5px] text-gray-700">{s}</span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-widest text-red-500 mb-2">Areas to Improve</div>
                              {dev.improvements.map((s, j) => (
                                <div key={j} className="flex items-start gap-1.5 mb-1.5">
                                  <span className="text-amber-500 mt-0.5 text-[11px] shrink-0">→</span>
                                  <span className="text-[12.5px] text-gray-700">{s}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {dev.est_hours > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-[11.5px] text-gray-500 mb-1">
                                <span>Hours efficiency</span>
                                <span className={dev.actual_hours > dev.est_hours ? "text-red-500" : "text-emerald-600"}>
                                  {dev.actual_hours > dev.est_hours
                                    ? `+${(dev.actual_hours - dev.est_hours).toFixed(1)}h over`
                                    : `${(dev.est_hours - dev.actual_hours).toFixed(1)}h under`}
                                </span>
                              </div>
                              <ProgressBar value={Math.min(100, Math.round((dev.est_hours / Math.max(dev.actual_hours, dev.est_hours, 1)) * 100))} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Project Health */}
            <div className="card-lg p-5">
              <SectionHeader icon={FolderKanban} title="Project Health" color="text-blue-500" />
              <div className="grid grid-cols-3 gap-4">
                {/* Healthy */}
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">Healthy ({report.project_health.healthy.length})</span>
                  </div>
                  {report.project_health.healthy.map((p, i) => (
                    <div key={i} className="mb-2 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                      <div className="text-[12.5px] font-semibold text-gray-800">{p.name}</div>
                      <div className="text-[11.5px] text-gray-500 mt-0.5">{p.note}</div>
                    </div>
                  ))}
                  {report.project_health.healthy.length === 0 && <div className="text-[12px] text-gray-400">None</div>}
                </div>
                {/* At Risk */}
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-600">At Risk ({report.project_health.at_risk.length})</span>
                  </div>
                  {report.project_health.at_risk.map((p, i) => (
                    <div key={i} className="mb-2 p-2.5 rounded-lg bg-amber-50/60 border border-amber-100">
                      <div className="text-[12.5px] font-semibold text-gray-800">{p.name}</div>
                      <div className="text-[11.5px] text-gray-500 mt-0.5">{p.note}</div>
                    </div>
                  ))}
                  {report.project_health.at_risk.length === 0 && <div className="text-[12px] text-gray-400">None</div>}
                </div>
                {/* Critical */}
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-red-600">Critical ({report.project_health.critical.length})</span>
                  </div>
                  {report.project_health.critical.map((p, i) => (
                    <div key={i} className="mb-2 p-2.5 rounded-lg bg-red-50/60 border border-red-100">
                      <div className="text-[12.5px] font-semibold text-gray-800">{p.name}</div>
                      <div className="text-[11.5px] text-gray-500 mt-0.5">{p.note}</div>
                    </div>
                  ))}
                  {report.project_health.critical.length === 0 && <div className="text-[12px] text-gray-400">None</div>}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="card-lg p-5">
              <SectionHeader icon={Lightbulb} title="Recommendations" color="text-amber-500" />
              <div className="space-y-3">
                {report.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:border-indigo-100 hover:bg-indigo-50/20 transition-all">
                    <div className="shrink-0 mt-0.5">
                      <PriorityBadge priority={r.priority} />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-semibold text-gray-800 mb-0.5">{r.action}</div>
                      <div className="text-[12.5px] text-gray-500">{r.rationale}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!report && !generating && (
          <div className="card-lg p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={24} className="text-indigo-500" />
            </div>
            <div className="text-[15px] font-semibold text-gray-700 mb-2">No report yet</div>
            <div className="text-[13px] text-gray-400 mb-6 max-w-md mx-auto">
              Click "Generate Report" to get an AI-powered analysis of your team, projects, and clients.
            </div>
            <button className="btn btn-primary" onClick={generateReport}>
              <Sparkles size={15} /> Generate First Report
            </button>
          </div>
        )}
      </div>
    </>
  );
}
