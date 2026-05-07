"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  LogOut, 
  CheckSquare,
  Archive
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Arşiv", icon: Archive, path: "/dashboard?view=archived" },
    { name: "Takvim", icon: Calendar, path: "/calendar" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header" title="TaskFlow">
        <div style={{ background: "var(--accent)", color: "white", padding: "8px", borderRadius: "12px", display: "flex", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>
          <CheckSquare size={22} strokeWidth={2.5} />
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path} 
            title={item.name}
            className={`nav-item ${pathname === item.path ? "nav-item-active" : ""}`}
          >
            <item.icon size={20} />
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div 
          title={user?.email}
          style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--accent-light)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", border: "2px solid white", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
        >
          {user?.email?.[0].toUpperCase()}
        </div>
        <button 
          title="Çıkış Yap"
          className="btn btn-ghost" 
          onClick={handleLogout} 
          style={{ padding: "10px", color: "var(--text-muted)", borderRadius: "10px" }}
        >
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
}
