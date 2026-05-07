"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { LayoutDashboard, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("E-posta veya şifre hatalı.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fff" }}>
      {/* Sol Taraf - Tasarım Alanı */}
      <div style={{
        flex: 1,
        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Dekoratif Çemberler */}
        <div style={{ position: "absolute", top: "-10%", right: "-10%", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: "500px", height: "500px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", filter: "blur(60px)" }} />
        
        <div style={{ zIndex: 1, maxWidth: "480px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
            <div style={{ background: "white", color: "#4f46e5", padding: "10px", borderRadius: "12px" }}>
              <LayoutDashboard size={32} strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-1px" }}>TaskFlow</h1>
          </div>
          <h2 style={{ fontSize: "3rem", fontWeight: 700, lineHeight: 1.1, marginBottom: "24px" }}>
            İşlerinizi akışına bırakın.
          </h2>
          <p style={{ fontSize: "1.1rem", opacity: 0.9, lineHeight: 1.6 }}>
            Modern ekipler için tasarlandı. Sürükle, bırak, yapay zeka ile saniyeler içinde görevler oluştur ve üretkenliği zirveye taşı.
          </p>
        </div>
      </div>

      {/* Sağ Taraf - Form Alanı */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        backgroundColor: "#f8fafc"
      }}>
        <div style={{
          width: "100%",
          maxWidth: "420px",
          background: "white",
          padding: "48px",
          borderRadius: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)"
        }}>
          <div style={{ marginBottom: "32px", textAlign: "center" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Tekrar Hoş Geldiniz</h2>
            <p style={{ color: "#64748b", fontSize: "0.95rem" }}>Hesabınıza giriş yaparak devam edin</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {error && (
              <div style={{ background: "#fef2f2", color: "#ef4444", padding: "12px", borderRadius: "10px", fontSize: "0.85rem", border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>E-posta Adresi</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@sirket.com"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 42px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    outline: "none",
                    fontSize: "0.95rem",
                    transition: "all 0.2s ease"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#4f46e5"}
                  onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Şifre</label>
                <a href="#" style={{ fontSize: "0.8rem", color: "#4f46e5", textDecoration: "none", fontWeight: 500 }}>Şifremi unuttum</a>
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 42px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    outline: "none",
                    fontSize: "0.95rem",
                    transition: "all 0.2s ease"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#4f46e5"}
                  onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#4f46e5",
                color: "white",
                border: "none",
                padding: "14px",
                borderRadius: "12px",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                opacity: loading ? 0.7 : 1
              }}
              onMouseOver={(e) => !loading && (e.target.style.background = "#4338ca")}
              onMouseOut={(e) => !loading && (e.target.style.background = "#4f46e5")}
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "32px", fontSize: "0.9rem", color: "#64748b" }}>
            Henüz hesabınız yok mu?{" "}
            <Link href="/auth/register" style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>
              Hesap Oluştur
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
