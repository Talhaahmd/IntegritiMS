"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

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
    const sb = createClient();
    const { error: authError } = await sb.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Invalid email or password. Please try again.");
    } else {
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div style={{ width: "100%", maxWidth: 420, padding: "0 16px" }}>
      {/* Card */}
      <div style={{
        background: "#fff",
        borderRadius: 20,
        boxShadow: "0 8px 48px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        padding: "40px 36px",
      }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52,
            borderRadius: 14,
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 8px 24px rgba(99,102,241,0.28)",
          }}>
            <img src="/logo.webp" alt="Logo" style={{ width: 32, height: 32, objectFit: "contain" }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px", margin: 0 }}>
            Integriti
          </h1>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 6, fontWeight: 400 }}>
            Operations Hub · Sign in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Email address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{
                width: "100%", height: 42, borderRadius: 10,
                border: "1.5px solid #E5E7EB",
                padding: "0 14px", fontSize: 14,
                outline: "none", background: "#FAFAFA",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "#6366F1")}
              onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", height: 42, borderRadius: 10,
                  border: "1.5px solid #E5E7EB",
                  padding: "0 44px 0 14px", fontSize: 14,
                  outline: "none", background: "#FAFAFA",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "#6366F1")}
                onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none",
                  color: "#9CA3AF", cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center",
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px", borderRadius: 10,
              background: "#FEF2F2", color: "#DC2626",
              fontSize: 13, fontWeight: 500,
            }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", height: 44,
              borderRadius: 10, border: "none",
              background: loading ? "#A5B4FC" : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: loading ? "none" : "0 4px 14px rgba(99,102,241,0.35)",
              transition: "all 0.2s", marginTop: 4,
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "#fff",
                  animation: "spin 0.7s linear infinite",
                }} />
                Signing in…
              </>
            ) : (
              <><LogIn size={16} /> Sign In</>
            )}
          </button>
        </form>
      </div>

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#9CA3AF" }}>
        Integriti Operations Hub · Internal Access Only
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
