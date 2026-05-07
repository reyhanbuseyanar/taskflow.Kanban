"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { LayoutDashboard, Mail, Lock, ArrowRight, User } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
    } else {
      setError("Kayıt başarılı! Lütfen giriş yapmadan önce e-posta adresinize gelen onay linkine tıklayın.");
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      backgroundColor: "#f1f5f9",
      padding: isMobile ? "16px" : "24px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "500px",
        background: "white",
        padding: isMobile ? "32px 24px" : "60px",
        borderRadius: isMobile ? "24px" : "32px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{ marginBottom: isMobile ? "30px" : "40px", textAlign: "center" }}>
          <div style={{ 
            display: "inline-flex", 
            background: "#4f46e5", 
            color: "white", 
            padding: isMobile ? "10px" : "12px", 
            borderRadius: "16px",
            marginBottom: "20px" 
          }}>
            <LayoutDashboard size={isMobile ? 24 : 28} />
          </div>
          <h2 style={{ fontSize: isMobile ? "1.6rem" : "2rem", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Hesap Oluştur</h2>
          <p style={{ color: "#64748b", fontSize: isMobile ? "0.9rem" : "1rem", fontWeight: 500 }}>TaskFlow dünyasına hemen katılın</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {error && (
            <div style={{ 
              background: error.includes("başarılı") ? "#f0fdf4" : "#fef2f2", 
              color: error.includes("başarılı") ? "#16a34a" : "#ef4444", 
              padding: "16px", 
              borderRadius: "12px", 
              fontSize: "0.9rem", 
              border: `1px solid ${error.includes("başarılı") ? "#bbf7d0" : "#fecaca"}`, 
              display: "flex", 
              alignItems: "center", 
              gap: "8px" 
            }}>
              <span>{error.includes("başarılı") ? "✅" : "⚠️"}</span> {error}
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>Ad Soyad</label>
            <div style={{ position: "relative" }}>
              <User size={20} color="#94a3b8" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Adınız Soyadınız"
                required
                style={{
                  width: "100%",
                  padding: "14px 16px 14px 48px",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  outline: "none",
                  fontSize: "1rem",
                  transition: "all 0.2s ease",
                  backgroundColor: "#f8fafc"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>E-posta Adresi</label>
            <div style={{ position: "relative" }}>
              <Mail size={20} color="#94a3b8" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@sirket.com"
                required
                style={{
                  width: "100%",
                  padding: "14px 16px 14px 48px",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  outline: "none",
                  fontSize: "1rem",
                  transition: "all 0.2s ease",
                  backgroundColor: "#f8fafc"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>Şifre</label>
            <div style={{ position: "relative" }}>
              <Lock size={20} color="#94a3b8" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                required
                style={{
                  width: "100%",
                  padding: "14px 16px 14px 48px",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  outline: "none",
                  fontSize: "1rem",
                  transition: "all 0.2s ease",
                  backgroundColor: "#f8fafc"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>Şifre Tekrar</label>
            <div style={{ position: "relative" }}>
              <Lock size={20} color="#94a3b8" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Şifrenizi tekrar girin"
                required
                style={{
                  width: "100%",
                  padding: "14px 16px 14px 48px",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  outline: "none",
                  fontSize: "1rem",
                  transition: "all 0.2s ease",
                  backgroundColor: "#f8fafc"
                }}
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
              padding: "16px",
              borderRadius: "14px",
              fontSize: "1.1rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)",
              transition: "all 0.2s ease",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Kaydediliyor..." : "Hesabı Oluştur"}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "40px", fontSize: "0.95rem", color: "#64748b" }}>
          Zaten hesabınız var mı?{" "}
          <Link href="/auth/login" style={{ color: "#4f46e5", fontWeight: 700, textDecoration: "none" }}>
            Giriş Yapın
          </Link>
        </p>
      </div>
    </div>
  );
}
