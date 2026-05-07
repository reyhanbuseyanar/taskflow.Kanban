"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, User, LogOut, Archive } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function MobileBottomNav({ user }) {
  const pathname = usePathname();

  // Giriş ve Kayıt sayfalarında gösterme
  if (pathname.startsWith("/auth")) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Arşiv", icon: Archive, path: "/dashboard?view=archived" },
    { name: "Takvim", icon: Calendar, path: "/calendar" },
  ];

  return (
    <nav className="mobile-bottom-nav md:hidden">
      {navItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={`mobile-bottom-nav-item ${
            pathname === item.path ? "mobile-bottom-nav-item-active" : ""
          }`}
        >
          <item.icon size={20} />
          <span>{item.name}</span>
        </Link>
      ))}
      <button 
        onClick={handleLogout}
        className="mobile-bottom-nav-item border-none bg-transparent cursor-pointer"
      >
        <LogOut size={20} />
        <span>Çıkış</span>
      </button>
    </nav>
  );
}
