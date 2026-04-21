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
  History, AlertCircle, Building2
} from "lucide-react";

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-tertiary)",
  marginBottom: 12,
};

function SeverityDot({ severity }: { severity: string }) {
  const color = severity === "high" ? "#EF4444" : severity === "medium" ? "#F59E0B" : "#3B82F6";
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 6 }} />;
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: any = {
    immediate: { bg: "#FEF2F2", text: "#DC2626", border: "#FEE2E2" },
    soon: { bg: "#FFFBEB", text: "#D97706", border: "#FEF3C7" },
    consider: { bg: "#EFF6FF", text: "#2563EB", border: "#DBEAFE" },
  };
  const s = styles[priority] || { bg: "#F8FAFC", text: "#64748B", border: "#F1F5F9" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: s.bg, color: s.text, border: `1px solid ${s.border}`, padding: "2px 8px" }}>
      {priority}
    </span>
  );
}

function SectionHeader({ icon: Icon, title, color = "var(--text-primary)" }: { icon: any; title: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <Icon size={16} style={{ color }} />
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{title}</h2>
    </div>
  );
}

export default function AIManagerPage() {
  const { data: members, loading: ml } = useTeamMembers();
  const { data: clients, loading: cl } = useClients();
  const { data: projects, loading: pl } = useProjects();
  const { data: tasks, loading: tl } = useTasks();
  const loading = ml || cl || pl || tl;

  const [report, setReport] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [tokensUsed, setTokensUsed] = useState(0);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedDev, setExpandedDev] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    const { data } = await createSBClient().from("ai_reports").select("*").order("generated_at", { ascending: false }).limit(10);
    setSavedReports((data as any[]) ?? []);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function generateReport() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          data: { 
            clients: clients.map(c => ({ name: c.name, status: c.status, overdue: c.overdue_tasks })),
            projects: projects.map(p => ({ name: p.name, status: p.status, health: p.health_status, progress: p.progress_percent })),
            tasks: tasks.map(t => ({ name: t.name, status: t.status, overdue: t.overdue })),
            team: members.map(m => ({ name: m.full_name, title: m.title, efficiency: m.on_time_rate }))
          } 
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to generate report");
      setReport(json.report);
      setTokensUsed(json.tokens ?? 0);
      await createSBClient().from("ai_reports").insert({ report_type: "full", title: `Operations Report — ${formatDate(new Date(), "MMM d, yyyy")}`, content: json.report, tokens_used: json.tokens ?? 0 });
      loadHistory();
    } catch (e: any) { setError(e.message); }
    finally { setGenerating(false); }
  }

  if (loading) return (
    <>
      <TopBar title="AI Manager" />
      <PageLoader />
    </>
  );

  return (
    <>
      <TopBar title="AI Manager" subtitle="GPT-4o powered operations intelligence" />

      <div style={{ padding: "24px 28px 40px" }} className="animate-fade-in">
        <div style={{ maxWidth: 1100 }}>
          
          {/* Hero Bar */}
          <div className="card-lg" style={{ padding: 24, display: "flex", alignItems: "center", gap: 20, marginBottom: 20, background: "linear-gradient(135deg, #fff 0%, #F5F7FF 100%)" }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 8px 20px rgba(99, 102, 241, 0.2)" }}>
              <Sparkles size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>Generate Intelligence Report</div>
              <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 2 }}>Analyze {clients.length} clients, {projects.length} projects, and {members.length} team members for critical insights.</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {savedReports.length > 0 && (
                <button className="btn btn-secondary" style={{ height: 40, fontSize: 13, gap: 8 }} onClick={() => setShowHistory(!showHistory)}>
                  <History size={14} /> History ({savedReports.length})
                </button>
              )}
              <button className="btn btn-primary" style={{ height: 40, fontSize: 13, gap: 8, padding: "0 20px" }} onClick={generateReport} disabled={generating}>
                {generating ? <><RefreshCw size={14} className="animate-spin" /> Analyzing...</> : <><Sparkles size={14} /> Run AI Analysis</>}
              </button>
            </div>
          </div>

          {showHistory && (
            <div className="card-lg animate-fade-in" style={{ padding: 16, marginBottom: 20 }}>
              <div style={labelStyle}>Recent Reports</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {savedReports.map(r => (
                  <button key={r.id} onClick={() => { setReport(r.content); setShowHistory(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border-subtle)", background: "#fff", cursor: "pointer" }} className="hover:bg-indigo-50/30 transition-colors">
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{formatDate(r.generated_at)} · {r.tokens_used} tokens</div>
                    </div>
                    <ArrowRight size={14} style={{ color: "var(--text-tertiary)" }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {generating && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[1,2,3].map(i => <div key={i} className="card-lg animate-pulse" style={{ height: 120, padding: 20, background: "var(--surface-2)" }} />)}
            </div>
          )}

          {report && !generating && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Summary Pill */}
              <div className="card-lg" style={{ padding: 20, background: "var(--accent-light)", borderLeft: "4px solid var(--accent)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <Zap size={14} style={{ color: "var(--accent)" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)" }}>Executive Summary</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#312E81", lineHeight: 1.6 }}>{report.executive_summary}</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Critical Actions */}
                <div className="card-lg" style={{ padding: 20 }}>
                  <SectionHeader icon={AlertTriangle} title="Critical Actions" color="#DC2626" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {report.critical_actions.map((a: any, i: number) => (
                      <div key={i} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 12, background: a.severity === "high" ? "#FEF2F2" : "#F8FAFC", border: a.severity === "high" ? "1px solid #FEE2E2" : "1px solid var(--border-subtle)" }}>
                        <SeverityDot severity={a.severity} />
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.5 }}>{a.text}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Performance */}
                <div className="card-lg" style={{ padding: 20 }}>
                  <SectionHeader icon={TrendingUp} title="Team Performance" color="var(--accent)" />
                  <div style={{ padding: 16, borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--border-subtle)", marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 8 }}>Agency On-Time Rate</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <ProgressBar value={report.team_performance.on_time_rate} style={{ flex: 1 }} />
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>{report.team_performance.on_time_rate}%</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 8, letterSpacing: "0.05em" }}>TOP PERFORMERS</div>
                      {report.team_performance.top_performers.map((p: any, i: number) => (
                        <div key={i} style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                          <CheckCircle2 size={12} style={{ color: "#059669" }} /> {p}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#D97706", marginBottom: 8, letterSpacing: "0.05em" }}>NEEDS ATTENTION</div>
                      {report.team_performance.needs_attention.map((p: any, i: number) => (
                        <div key={i} style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                          <AlertCircle size={12} style={{ color: "#D97706" }} /> {p}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Developer Insights */}
              <div className="card-lg" style={{ padding: 20 }}>
                <SectionHeader icon={User} title="Developer Performance Deep-Dive" color="#8B5CF6" />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {report.developer_insights.map((dev: any, i: number) => (
                    <div key={i} style={{ border: "1px solid var(--border-subtle)", borderRadius: 14, overflow: "hidden" }}>
                      <button onClick={() => setExpandedDev(expandedDev === dev.name ? null : dev.name)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, padding: 14, border: "none", background: "#fff", cursor: "pointer" }} className="hover:bg-gray-50 transition-colors">
                        <Avatar name={dev.name} size="sm" />
                        <div style={{ flex: 1, textAlign: "left" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{dev.name}</span>
                            <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: "#EEF2FF", color: "#4F46E5" }}>{dev.performance_label}</span>
                          </div>
                          <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 4 }}>{dev.tasks_completed} tasks completed · {dev.on_time_rate}% on-time · {dev.workload_status}</div>
                        </div>
                        {expandedDev === dev.name ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      {expandedDev === dev.name && (
                        <div style={{ padding: 16, background: "var(--surface-2)", borderTop: "1px solid var(--border-subtle)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 8 }}>STRENGTHS</div>
                            {dev.strengths.map((s: any, j: number) => <div key={j} style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>• {s}</div>)}
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", marginBottom: 8 }}>IMPROVEMENTS</div>
                            {dev.improvements.map((s: any, j: number) => <div key={j} style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>• {s}</div>)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="card-lg" style={{ padding: 20 }}>
                <SectionHeader icon={Lightbulb} title="Strategic Recommendations" color="#F59E0B" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {report.recommendations.map((r: any, i: number) => (
                    <div key={i} style={{ padding: 16, borderRadius: 14, border: "1px solid var(--border-subtle)", background: "#fff", position: "relative" }} className="hover:shadow-md transition-all">
                      <div style={{ position: "absolute", top: 12, right: 12 }}><PriorityBadge priority={r.priority} /></div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, paddingRight: 80 }}>{r.action}</div>
                      <p style={{ fontSize: 12.5, color: "var(--text-tertiary)", lineHeight: 1.5 }}>{r.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!report && !generating && (
            <div className="card-lg" style={{ padding: 60, textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Sparkles size={32} style={{ color: "var(--accent)", opacity: 0.4 }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>Ready for Analysis</h2>
              <p style={{ fontSize: 14, color: "var(--text-tertiary)", marginTop: 8, maxWidth: 400, margin: "8px auto 24px" }}>Click the generate button to start an AI-powered operations audit across all modules.</p>
              <button className="btn btn-primary" style={{ height: 44, padding: "0 32px", fontSize: 14, gap: 10 }} onClick={generateReport}>
                <Sparkles size={16} /> Run Analysis Now
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
