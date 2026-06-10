"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

const FEATURES = [
  {
    title: "Client & Project Management",
    desc: "Track every client, project, and milestone from a single dashboard.",
  },
  {
    title: "Team Task Assignment",
    desc: "Assign tasks to developers, monitor progress, and hit deadlines.",
  },
  {
    title: "Financial Dashboard",
    desc: "Milestone billing, payment tracking, and revenue visibility.",
  },
  {
    title: "Smart Scheduler",
    desc: "Visualise team workload, schedule tasks, and prevent burnout.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await createClient().auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div style={{ display: "flex", width: "100%", minHeight: "100vh" }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        flex: "0 0 58%",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Background image */}
        <img
          src="https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
          }}
        />
        {/* Dark gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(10,12,28,0.82) 0%, rgba(20,20,45,0.70) 50%, rgba(10,12,28,0.75) 100%)",
        }} />
        {/* Subtle noise/grain overlay for texture */}
        <div style={{
          position: "absolute", inset: 0,
          background: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
          opacity: 0.4,
        }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", padding: "44px 52px" }}>

          {/* Logo + brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 11,
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <img src="/logo.webp" alt="Integriti" style={{ width: 26, height: 26, objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px", lineHeight: 1 }}>Integriti</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500, letterSpacing: "0.04em", marginTop: 2 }}>OPERATIONS HUB</div>
            </div>
          </div>

          {/* Hero text — vertically centered */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 480 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(99,102,241,0.22)", border: "1px solid rgba(99,102,241,0.35)",
              borderRadius: 99, padding: "5px 14px", marginBottom: 24,
              backdropFilter: "blur(6px)", width: "fit-content",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#818CF8" }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "#A5B4FC", letterSpacing: "0.05em" }}>INTERNAL MANAGEMENT SYSTEM</span>
            </div>

            <h1 style={{
              fontSize: 44, fontWeight: 900, color: "#fff",
              lineHeight: 1.08, letterSpacing: "-1.5px", margin: "0 0 18px",
            }}>
              One hub for<br />
              <span style={{
                background: "linear-gradient(90deg, #818CF8 0%, #C084FC 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>everything</span> you run.
            </h1>

            <p style={{
              fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.7,
              fontWeight: 400, margin: "0 0 36px", maxWidth: 420,
            }}>
              Integriti Operations Hub brings your clients, projects, team, tasks,
              and finances together — so nothing slips through the cracks.
            </p>

            {/* Feature list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {FEATURES.map((f) => (
                <div key={f.title} style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                    background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <CheckCircle2 size={13} style={{ color: "#818CF8" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{f.title}</div>
                    <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", marginTop: 2, lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
              © 2026 Integriti · Internal access only
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: "0 0 42%",
        background: "#F7F8FC",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* Top brand (mobile fallback + desktop refinement) */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{
              width: 58, height: 58, borderRadius: 16,
              background: "#fff",
              boxShadow: "0 2px 12px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <img src="/logo.webp" alt="Integriti" style={{ width: 36, height: 36, objectFit: "contain" }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F0F1A", letterSpacing: "-0.5px", margin: 0 }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 13.5, color: "#8B8FA8", marginTop: 6, fontWeight: 400 }}>
              Sign in to Integriti Operations Hub
            </p>
          </div>

          {/* Apple-card login form */}
          <div style={{
            background: "#fff",
            borderRadius: 22,
            boxShadow: "0 2px 2px rgba(0,0,0,0.04), 0 8px 40px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)",
            padding: "32px 30px 28px",
          }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>

              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: "block", fontSize: 12.5, fontWeight: 600,
                  color: "#374151", marginBottom: 7, letterSpacing: "0.01em",
                }}>
                  Email address
                </label>
                <input
                  type="email" required autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@integriti.io"
                  style={{
                    width: "100%", height: 44, borderRadius: 11,
                    border: "1.5px solid #E8EAF0", background: "#F9FAFB",
                    padding: "0 14px", fontSize: 14, color: "#0F0F1A",
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "#6366F1";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.10)";
                    e.currentTarget.style.background = "#fff";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = "#E8EAF0";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.background = "#F9FAFB";
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: "block", fontSize: 12.5, fontWeight: 600,
                  color: "#374151", marginBottom: 7, letterSpacing: "0.01em",
                }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"} required
                    autoComplete="current-password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    style={{
                      width: "100%", height: 44, borderRadius: 11,
                      border: "1.5px solid #E8EAF0", background: "#F9FAFB",
                      padding: "0 46px 0 14px", fontSize: 14, color: "#0F0F1A",
                      outline: "none", boxSizing: "border-box",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = "#6366F1";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.10)";
                      e.currentTarget.style.background = "#fff";
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = "#E8EAF0";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.background = "#F9FAFB";
                    }}
                  />
                  <button
                    type="button" onClick={() => setShowPw(s => !s)}
                    style={{
                      position: "absolute", right: 13, top: "50%",
                      transform: "translateY(-50%)",
                      background: "none", border: "none",
                      color: "#9CA3AF", cursor: "pointer",
                      padding: 0, display: "flex", alignItems: "center",
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "11px 14px", borderRadius: 10,
                  background: "#FEF2F2", border: "1px solid #FECACA",
                  color: "#DC2626", fontSize: 13, fontWeight: 500,
                  marginBottom: 16,
                }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}

              {/* Sign in button */}
              <button
                type="submit" disabled={loading}
                style={{
                  width: "100%", height: 46, borderRadius: 12, border: "none",
                  background: loading
                    ? "#A5B4FC"
                    : "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                  color: "#fff", fontSize: 15, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: loading ? "none" : "0 4px 20px rgba(79,70,229,0.38)",
                  transition: "all 0.2s", letterSpacing: "-0.1px",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.35)",
                      borderTopColor: "#fff",
                      animation: "spin 0.65s linear infinite",
                    }} />
                    Signing in…
                  </>
                ) : (
                  <>Sign In <ArrowRight size={16} /></>
                )}
              </button>

            </form>
          </div>

          {/* Footer note */}
          <p style={{
            textAlign: "center", marginTop: 24,
            fontSize: 12, color: "#B0B4C4", lineHeight: 1.6,
          }}>
            This is an internal tool. Access is restricted<br />to authorised Integriti team members only.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .login-left { display: none !important; }
          .login-right { flex: 1 !important; }
        }
      `}</style>
    </div>
  );
}
