"use client";

import { useState } from "react";
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

    // Supabase'de e-posta onayı (Confirm Email) açıksa session dönmez.
    if (data.session) {
      router.push("/dashboard");
    } else {
      // E-posta onayı gerekiyorsa kullanıcıya mesaj göster.
      setError("Kayıt başarılı! Lütfen giriş yapmadan önce e-posta adresinize gelen onay linkine tıklayın. (Eğer onay maili gelmediyse Supabase ayarlarından 'Confirm Email' seçeneğini kapatın).");
      setLoading(false);
    }

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
            Ekibinizle Senkronize Olun.
          </h2>
          <p style={{ fontSize: "1.1rem", opacity: 0.9, lineHeight: 1.6 }}>
            Projelerinizi daha akıllı yönetin. Saniyeler içinde hesap oluşturun ve yeni nesil görev yönetiminin keyfini çıkarın.
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
            <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Ücretsiz Kayıt Olun</h2>
            <p style={{ color: "#64748b", fontSize: "0.95rem" }}>Bilgilerinizi girerek hemen başlayın</p>
          </div>

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {error && (
              <div style={{ background: "#fef2f2", color: "#ef4444", padding: "12px", borderRadius: "10px", fontSize: "0.85rem", border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Ad Soyad</label>
              <div style={{ position: "relative" }}>
                <User size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Adınız Soyadınız"
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
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Şifre</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="En az 6 karakter"
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
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>Şifre Tekrar</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Şifrenizi tekrar girin"
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
                marginTop: "12px",
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
              {loading ? "Kayıt yapılıyor..." : "Hemen Başla"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "32px", fontSize: "0.9rem", color: "#64748b" }}>
            Zaten hesabınız var mı?{" "}
            <Link href="/auth/login" style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>
              Giriş Yapın
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
