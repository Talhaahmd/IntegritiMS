"use client";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { Settings, Palette, Building2, Clock, Tag, FileText, Bell, Shield, CheckCircle2, ChevronRight, Check } from "lucide-react";

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: 6,
  letterSpacing: "0.01em",
};

const SECTION = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div className="card-lg" style={{ marginBottom: 24, overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }}>
    <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-2)", display: "flex", alignItems: "center", gap: 10 }}>
      <Icon size={14} style={{ color: "var(--text-tertiary)" }} />
      <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{title}</h3>
    </div>
    <div style={{ padding: 24 }}>{children}</div>
  </div>
);

const Field = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", borderBottom: "1px solid var(--border-subtle)" }} className="last:border-0">
    <div style={{ maxWidth: "60%" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{label}</div>
      {description && <div style={{ fontSize: 12.5, marginTop: 4, color: "var(--text-tertiary)", lineHeight: 1.5 }}>{description}</div>}
    </div>
    <div style={{ marginLeft: 32 }}>{children}</div>
  </div>
);

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("IntegritiMS");
  const [reportTitle, setReportTitle] = useState("Operations Report");
  const [workStart, setWorkStart] = useState("08:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [accentColor, setAccentColor] = useState("#6366F1");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const ACCENT_OPTIONS = ["#6366F1", "#8B5CF6", "#EC4899", "#10B981", "#0EA5E9", "#F59E0B", "#EF4444"];

  return (
    <>
      <TopBar title="Settings" subtitle="System configuration and workspace preferences" />

      <div style={{ padding: "24px 28px 60px" }} className="animate-fade-up">
        <div style={{ width: "100%" }}>
          
          {/* Branding */}
          <SECTION title="Company & Branding" icon={Building2}>
            <Field label="Company Name" description="Used as the sender identity in reports and PDF headers.">
              <input className="input-base" style={{ width: 280, height: 38, background: "#fff" }} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </Field>
            <Field label="Report Title" description="The default heading for all generated operations reports.">
              <input className="input-base" style={{ width: 280, height: 38, background: "#fff" }} value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
            </Field>
            <Field label="System Accent" description="Choose the primary color for buttons, progress bars, and highlights.">
              <div style={{ display: "flex", gap: 12 }}>
                {ACCENT_OPTIONS.map((c) => (
                  <button
                    key={c}
                    style={{
                      width: 32, height: 32, borderRadius: "50%", background: c, border: "none", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                      boxShadow: accentColor === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : "none",
                      transform: accentColor === c ? "scale(1.1)" : "scale(1)"
                    }}
                    onClick={() => setAccentColor(c)}
                  >
                    {accentColor === c && <Check size={16} strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </Field>
          </SECTION>

          {/* Operating Schedule */}
          <SECTION title="Operating Schedule" icon={Clock}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Standard Start Time</label>
                <div style={{ position: "relative" }}>
                  <Clock size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
                  <input type="time" className="input-base" style={{ height: 40, background: "#fff", paddingRight: 36, fontSize: 14 }} value={workStart} onChange={(e) => setWorkStart(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Standard End Time</label>
                <div style={{ position: "relative" }}>
                  <Clock size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
                  <input type="time" className="input-base" style={{ height: 40, background: "#fff", paddingRight: 36, fontSize: 14 }} value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} />
                </div>
              </div>
            </div>
            <Field label="Business Days" description="Define the standard work week for schedule calculations.">
              <div style={{ display: "flex", gap: 8 }}>
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => (
                  <button
                    key={d}
                    style={{
                      width: 44, height: 44, borderRadius: 12, border: i < 5 ? "none" : "1px solid var(--border)", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                      background: i < 5 ? "var(--accent)" : "#fff",
                      color: i < 5 ? "#fff" : "var(--text-tertiary)",
                      boxShadow: i < 5 ? "0 4px 12px rgba(79, 70, 229, 0.2)" : "none"
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Field>
          </SECTION>

          {/* Taxonomy */}
          <SECTION title="Taxonomy & Labels" icon={Tag}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {["Development","R&D","QA","Design","Maintenance","Client Update","Internal Review","Urgent Fix"].map((cat) => (
                <div key={cat} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 12, background: "#fff", border: "1px solid var(--border-subtle)", transition: "all 0.2s" }} className="hover:border-indigo-200 hover:shadow-sm group">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>{cat}</span>
                  </div>
                  <button style={{ fontSize: 12, fontWeight: 700, color: "var(--text-tertiary)", border: "none", background: "transparent", cursor: "pointer", opacity: 0 }} className="group-hover:opacity-100 transition-opacity">
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </SECTION>

          {/* Notifications */}
          <SECTION title="Automated Alerts" icon={Bell}>
            <Field label="Overdue Task Alerts" description="Notify admins and assignees when a task misses its deadline.">
              <label style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" defaultChecked style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
                <div style={{ width: 44, height: 24, borderRadius: 24, background: "var(--accent)", transition: "all 0.2s", position: "relative", boxShadow: "0 2px 8px rgba(79, 70, 229, 0.2)" }}>
                  <div style={{ position: "absolute", top: 3, left: 23, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "all 0.2s" }} />
                </div>
              </label>
            </Field>
            <Field label="Interaction Reminders" description="Alert if a high-priority client hasn't been updated in 48 hours.">
              <label style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" defaultChecked style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
                <div style={{ width: 44, height: 24, borderRadius: 24, background: "var(--accent)", transition: "all 0.2s", position: "relative", boxShadow: "0 2px 8px rgba(79, 70, 229, 0.2)" }}>
                  <div style={{ position: "absolute", top: 3, left: 23, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "all 0.2s" }} />
                </div>
              </label>
            </Field>
          </SECTION>

          {/* Security */}
          <SECTION title="Security & Access" icon={Shield}>
            <Field label="Administrator Email" description="The primary account for system-level configurations.">
              <input className="input-base" style={{ width: 320, height: 40, background: "#fff" }} defaultValue="admin@integritims.com" type="email" />
            </Field>
            <Field label="Account Protection" description="Manage passwords and two-factor authentication.">
              <button className="btn btn-secondary" style={{ height: 40, fontSize: 13.5, gap: 8, px: 24 }}>
                <Shield size={14} /> Update Security Settings
              </button>
            </Field>
          </SECTION>

          {/* Save Button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <button className="btn btn-primary" style={{ height: 46, padding: "0 40px", fontSize: 15, fontWeight: 700, minWidth: 240, gap: 10, boxShadow: "0 12px 30px rgba(79, 70, 229, 0.3)" }} onClick={handleSave}>
              {saved ? <><CheckCircle2 size={18} /> Settings Saved</> : "Save Preferences"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
