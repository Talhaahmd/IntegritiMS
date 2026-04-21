"use client";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { Settings, Palette, Building2, Clock, Tag, FileText, Bell, Shield } from "lucide-react";

const SECTION = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="card-lg p-6 mb-4">
    <h3 className="text-[12px] font-semibold uppercase tracking-widest text-gray-400 mb-5 pb-3 border-b border-gray-100">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-b-0">
    <div className="max-w-sm">
      <div className="text-[13.5px] font-medium text-gray-800">{label}</div>
      {description && <div className="text-[12px] mt-0.5 text-gray-400">{description}</div>}
    </div>
    <div className="ml-8">{children}</div>
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
      <TopBar title="Settings" subtitle="Configure your workspace" />

      <div className="p-8 max-w-3xl animate-fade-in">
        {/* Company */}
        <SECTION title="Company & Branding">
          <Field label="Company Name" description="Shown in reports and PDF exports.">
            <input className="input-base w-52" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </Field>
          <Field label="Report Title" description="Default title used in exported reports.">
            <input className="input-base w-52" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
          </Field>
          <Field label="Accent Color" description="Primary brand color used throughout the UI.">
            <div className="flex gap-2">
              {ACCENT_OPTIONS.map((c) => (
                <button
                  key={c}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c,
                    outline: accentColor === c ? `2px solid ${c}` : "none",
                    outlineOffset: 2,
                  }}
                  onClick={() => setAccentColor(c)}
                />
              ))}
            </div>
          </Field>
        </SECTION>

        {/* Work Hours */}
        <SECTION title="Work Hours">
          <Field label="Work Start Time" description="Used for scheduler default view.">
            <input type="time" className="input-base w-36" value={workStart} onChange={(e) => setWorkStart(e.target.value)} />
          </Field>
          <Field label="Work End Time" description="Used for scheduler default view.">
            <input type="time" className="input-base w-36" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} />
          </Field>
          <Field label="Work Days" description="Select the days considered working days.">
            <div className="flex gap-2">
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => (
                <button
                  key={d}
                  className={`w-9 h-9 rounded-lg text-[12px] font-medium transition-all ${i < 5 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
        </SECTION>

        {/* Categories */}
        <SECTION title="Task Categories">
          <div className="space-y-2">
            {["Development","R&D","QA","Design","Maintenance","Client Update","Internal Review"].map((cat) => (
              <div
                key={cat}
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: "var(--bg)" }}
              >
                <div className="flex items-center gap-2.5">
                  <Tag size={13} style={{ color: "var(--accent)" }} />
                  <span className="text-[13px] font-medium">{cat}</span>
                </div>
                <button className="btn btn-ghost btn-sm text-[12px]" style={{ color: "var(--text-tertiary)" }}>Rename</button>
              </div>
            ))}
          </div>
        </SECTION>

        {/* PDF Export */}
        <SECTION title="PDF Export Preferences">
          <Field label="Include Company Logo" description="Add your company logo to PDF exports.">
            <button className="btn btn-secondary btn-sm">Upload Logo</button>
          </Field>
          <Field label="Report Footer" description="Custom text shown at the bottom of reports.">
            <input className="input-base w-64" placeholder="e.g. Confidential · IntegritiMS" />
          </Field>
          <Field label="Page Size" description="Paper size for PDF exports.">
            <select className="input-base w-32">
              <option>A4</option>
              <option>Letter</option>
              <option>A3</option>
            </select>
          </Field>
        </SECTION>

        {/* Notifications */}
        <SECTION title="Notifications">
          <Field label="Overdue Task Alerts" description="Get alerted when tasks become overdue.">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-10 h-5 rounded-full peer-checked:bg-indigo-600 bg-slate-300 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-transform peer-checked:after:translate-x-5" />
            </label>
          </Field>
          <Field label="Client Update Reminders" description="Remind when clients are waiting for an update.">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-10 h-5 rounded-full peer-checked:bg-indigo-600 bg-slate-300 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-transform peer-checked:after:translate-x-5" />
            </label>
          </Field>
          <Field label="Deadline Approaching" description="Alert 3 days before a project deadline.">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-10 h-5 rounded-full peer-checked:bg-indigo-600 bg-slate-300 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-transform peer-checked:after:translate-x-5" />
            </label>
          </Field>
        </SECTION>

        {/* Admin */}
        <SECTION title="Admin Account">
          <Field label="Admin Email" description="Email used to sign in.">
            <input className="input-base w-64" defaultValue="admin@integritims.com" type="email" />
          </Field>
          <Field label="Change Password" description="">
            <button className="btn btn-secondary btn-sm"><Shield size={13} /> Change Password</button>
          </Field>
        </SECTION>

        <div className="flex justify-end pt-2">
          <button className="btn btn-primary" onClick={handleSave}>
            {saved ? "✓ Saved!" : "Save Settings"}
          </button>
        </div>
      </div>
    </>
  );
}
