"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push("/dashboard");
      } else {
        router.push("/auth/login");
      }
    };
    checkSession();
  }, [router]);

  return (
    <div className="auth-container">
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>
          ✦ TaskFlow
        </div>
        <p style={{ color: "var(--text-muted)" }}>Yükleniyor...</p>
      </div>
    </div>
  );
}
