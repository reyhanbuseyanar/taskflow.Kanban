"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  UserPlus,
  X,
  Mail,
  Crown,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  LogOut,
  MoreHorizontal,
  Users,
} from "lucide-react";

const AVATAR_BG_COLORS = [
  "#dbeafe", "#fce7f3", "#d1fae5", "#fef3c7",
  "#ede9fe", "#ffe4e6", "#cffafe", "#e0e7ff",
];
const AVATAR_TEXT_COLORS = [
  "#2563eb", "#db2777", "#059669", "#d97706",
  "#7c3aed", "#e11d48", "#0891b2", "#4f46e5",
];

function getColorForUser(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_BG_COLORS.length;
  return { bg: AVATAR_BG_COLORS[idx], text: AVATAR_TEXT_COLORS[idx] };
}

function getInitials(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email) return email.substring(0, 2).toUpperCase();
  return "??";
}

export default function MemberList({ boardId, currentUserId, onUpdate }) {
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteTitle, setInviteTitle] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    fetchMembers();
    fetchCurrentProfile();
    
    // Mobil kontrolü
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [boardId, currentUserId]);

  // Panel dışına tıkla → kapat
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
        setShowInviteForm(false);
        setOpenMenuId(null);
        setMessage(null);
      }
    }
    if (showPanel) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPanel]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  async function fetchCurrentProfile() {
    if (!currentUserId) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUserId)
      .single();
    if (data) setCurrentProfile(data);
  }

  async function fetchMembers() {
    if (!currentUserId) return;
    setFetchLoading(true);
    try {
      let memberData = [];
      
      // KESİN GLOBAL ÇÖZÜM: Kullanıcının dahil olduğu TÜM projeleri bul ve üyeleri topla
      const [ownerBoards, memberBoards] = await Promise.all([
        supabase.from("boards").select("id").eq("user_id", currentUserId),
        supabase.from("board_members").select("board_id").eq("user_id", currentUserId)
      ]);
      
      const allBoardIds = new Set([
        ...(ownerBoards.data || []).map(b => b.id),
        ...(memberBoards.data || []).map(b => b.board_id)
      ]);

      if (allBoardIds.size > 0) {
        const { data, error } = await supabase
          .from("board_members")
          .select("id, user_id, role, created_at")
          .in("board_id", Array.from(allBoardIds));
        
        if (!error && data) {
          const seen = new Set();
          memberData = data.filter(m => {
            if (seen.has(m.user_id)) return false;
            seen.add(m.user_id);
            return true;
          });
        }
      }

      // Fallback
      if (memberData.length === 0) {
        memberData = [{ user_id: currentUserId, role: "owner", id: "me-" + currentUserId }];
      }

      const userIds = memberData.map(m => m.user_id);
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("id, email, full_name, title, avatar_url")
        .in("id", userIds);

      if (profileErr) throw profileErr;

      const combinedMembers = memberData.map(m => {
        const profile = profileData?.find(p => p.id === m.user_id);
        return {
          id: m.id,
          role: m.role,
          user_id: m.user_id,
          created_at: m.created_at,
          profiles: profile || { email: "Kullanıcı", id: m.user_id } // Profil yoksa bile objeyi koru
        };
      });

      setMembers(combinedMembers || []);
    } catch (err) {
      console.error("Üyeler yüklenemedi:", err.message);
    } finally {
      setFetchLoading(false);
    }
  }

  async function handleInvite(e) {
    e.preventDefault();
    let targetBoardId = boardId;

    // Eğer boardId yoksa (Dashboard'daysak) kullanıcının ilk projesini bul
    if (!targetBoardId && currentUserId) {
      const { data: myBoards } = await supabase.from("boards").select("id").eq("user_id", currentUserId).limit(1);
      if (myBoards && myBoards.length > 0) {
        targetBoardId = myBoards[0].id;
      } else {
        const { data: memberBoards } = await supabase.from("board_members").select("board_id").eq("user_id", currentUserId).limit(1);
        if (memberBoards && memberBoards.length > 0) {
          targetBoardId = memberBoards[0].board_id;
        }
      }
    }

    if (!targetBoardId) {
      setMessage({ type: "error", text: "Önce bir proje oluşturmalısınız!" });
      return;
    }

    if (!email.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("email", email.trim().toLowerCase())
        .single();

      if (profileError || !profile) {
        setMessage({ type: "error", text: "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı." });
        setLoading(false);
        return;
      }

      const alreadyMember = members.some((m) => m.user_id === profile.id);
      if (alreadyMember) {
        setMessage({ type: "error", text: "Bu kullanıcı zaten üye." });
        setLoading(false);
        return;
      }

      // Eğer title girdiyse profiles tablosunu güncelle
      if (inviteTitle.trim()) {
        await supabase
          .from("profiles")
          .update({ title: inviteTitle.trim() })
          .eq("id", profile.id);
      }

      const { data: newMember, error: insertError } = await supabase
        .from("board_members")
        .insert({ 
          board_id: targetBoardId, 
          user_id: profile.id, 
          role: role 
        })
        .select("id, role, user_id, created_at")
        .single();

      if (insertError) throw insertError;

      setMessage({ type: "success", text: "Kullanıcı başarıyla eklendi!" });
      setEmail("");
      setInviteTitle("");
      setShowInviteForm(false);
      fetchMembers();
      if (onUpdate) onUpdate();
    } catch (err) {
      setMessage({ type: "error", text: "Hata: " + err.message });
    } finally {
      setLoading(false);
    }
  }


  async function handleRemoveMember(memberId, memberName) {
    try {
      const { error } = await supabase.from("board_members").delete().eq("id", memberId);
      if (error) throw error;
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setOpenMenuId(null);
      if (onUpdate) onUpdate();
    } catch (err) {
      window.alert("Silinemedi: " + err.message);
    }
  }


  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  const MAX_VISIBLE = 3;
  const visibleMembers = members.slice(0, MAX_VISIBLE);
  const extraCount = members.length - MAX_VISIBLE;

  // --- STYLES ---
  const avatarStackBtn = {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
  };
  const avatarStackRow = {
    display: "flex",
    alignItems: "center",
  };
  const miniAvatar = (color, index, total) => ({
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.7rem",
    fontWeight: 700,
    backgroundColor: color.bg,
    color: color.text,
    border: "2.5px solid white",
    marginLeft: index > 0 ? "-8px" : "0",
    zIndex: total - index,
    position: "relative",
    transition: "transform 0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  });
  const extraBubble = {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.7rem",
    fontWeight: 700,
    backgroundColor: "#e2e8f0",
    color: "#475569",
    border: "2.5px solid white",
    marginLeft: "-8px",
    zIndex: 0,
  };
  const addBubble = {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    color: "#94a3b8",
    border: "2px dashed #cbd5e1",
    marginLeft: members.length > 0 ? "-8px" : "0",
    zIndex: 0,
    transition: "all 0.2s",
  };

  return (
    <div style={{ position: "relative" }} ref={panelRef}>
      {/* ========== AVATAR STACK (Header'da görünen) ========== */}
      <button
        onClick={() => { setShowPanel(!showPanel); setShowInviteForm(false); setOpenMenuId(null); setMessage(null); }}
        style={avatarStackBtn}
      >
        <div style={avatarStackRow}>
          {fetchLoading ? (
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#f1f5f9" }} />
          ) : (
            <>
              {visibleMembers.map((member, index) => {
                const profile = member.profiles;
                const initials = getInitials(profile?.full_name, profile?.email);
                const color = getColorForUser(member.user_id);

                return (
                  <div
                    key={member.id}
                    style={miniAvatar(color, index, visibleMembers.length)}
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      initials
                    )}
                  </div>
                );
              })}

              {extraCount > 0 && (
                <div style={extraBubble}>+{extraCount}</div>
              )}

              <div style={addBubble}>
                <UserPlus size={15} />
              </div>
            </>
          )}
        </div>
      </button>

      {/* ========== DROPDOWN PANEL ========== */}
      {showPanel && (
        <>
          {/* Mobil Arkaplan Karartma */}
          {isMobile && (
            <div 
              onClick={() => setShowPanel(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(4px)",
                zIndex: 4000,
                animation: "fadeIn 0.2s ease"
              }}
            />
          )}
          
          <div
            style={{
              position: isMobile ? "fixed" : "absolute",
              top: isMobile ? "50%" : "calc(100% + 12px)",
              left: isMobile ? "50%" : "auto",
              right: isMobile ? "auto" : "0",
              transform: isMobile ? "translate(-50%, -50%)" : "none",
              width: isMobile ? "90vw" : "340px",
              maxWidth: "360px",
              background: "white",
              borderRadius: "24px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              zIndex: 5000,
              overflow: "hidden",
              animation: isMobile ? "scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" : "slideDown 0.2s ease",
            }}
          >
          {/* ====== KULLANICI (Giriş yapan) ====== */}
          <div style={{
            background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
            padding: "16px 18px",
            borderBottom: "1px solid #f1f5f9",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                  fontWeight: 700,
                  backgroundColor: "#dbeafe",
                  color: "#2563eb",
                  border: "3px solid white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}>
                  {currentProfile?.avatar_url ? (
                    <img src={currentProfile.avatar_url} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    getInitials(currentProfile?.full_name, currentProfile?.email)
                  )}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {currentProfile?.full_name || "İsimsiz"}
                  </span>
                  <Crown size={14} color="#f59e0b" />
                </div>
                <p style={{ fontSize: "0.72rem", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>
                  {currentProfile?.email}
                </p>
              </div>
            </div>
          </div>

          {/* ====== TAKIM ARKADAŞLARI BAŞLIĞI + EKLE BUTONU ====== */}
          <div style={{
            padding: "12px 18px 6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Users size={14} color="#94a3b8" />
              <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Takım Arkadaşları
              </span>
            </div>
            <button
              onClick={() => { setShowInviteForm(!showInviteForm); setMessage(null); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "#3b82f6",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 10px",
                borderRadius: "8px",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
            >
              <UserPlus size={13} />
              Ekle
            </button>
          </div>

          {/* ====== DAVET FORMU ====== */}
          {showInviteForm && (
            <div style={{ padding: "4px 18px 10px" }}>
              <form onSubmit={handleInvite} style={{
                background: "#f8fafc",
                borderRadius: "12px",
                padding: "12px",
                border: "1px solid #f1f5f9",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}>
                <div style={{ position: "relative" }}>
                  <Mail size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-posta adresi"
                    required
                    style={{
                      width: "100%",
                      paddingLeft: "30px",
                      paddingRight: "10px",
                      paddingTop: "8px",
                      paddingBottom: "8px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.8rem",
                      outline: "none",
                      background: "white",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <input
                  type="text"
                  value={inviteTitle}
                  onChange={(e) => setInviteTitle(e.target.value)}
                  placeholder="Ünvan (örn: Frontend Developer)"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "0.8rem",
                    outline: "none",
                    background: "white",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.8rem",
                      outline: "none",
                      background: "white",
                      color: "#475569",
                    }}
                  >
                    <option value="member">👤 Member</option>
                    <option value="admin">👑 Admin</option>
                  </select>
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "white",
                      backgroundColor: loading || !email.trim() ? "#93c5fd" : "#3b82f6",
                      border: "none",
                      cursor: loading || !email.trim() ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      transition: "all 0.15s",
                    }}
                  >
                    {loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <UserPlus size={13} />}
                    {loading ? "..." : "Ekle"}
                  </button>
                </div>
                {message && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    fontSize: "0.72rem",
                    fontWeight: 500,
                    backgroundColor: message.type === "success" ? "#ecfdf5" : "#fef2f2",
                    color: message.type === "success" ? "#059669" : "#dc2626",
                  }}>
                    {message.type === "success" ? <Check size={13} /> : <AlertCircle size={13} />}
                    {message.text}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* ====== ÜYE LİSTESİ ====== */}
          <div style={{ padding: "2px 10px 8px", maxHeight: "260px", overflowY: "auto" }}>
            {members.map((member) => {
              const profile = member.profiles;
              const initials = getInitials(profile?.full_name, profile?.email);
              const color = getColorForUser(member.user_id);
              const isOwner = member.user_id === currentUserId;

              return (
                <div
                  key={member.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: "10px",
                    transition: "background 0.15s",
                    cursor: "default",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    {/* Avatar */}
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      backgroundColor: color.bg,
                      color: color.text,
                      flexShrink: 0,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    }}>
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        initials
                      )}
                    </div>
                    {/* İsim + Ünvan */}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
                        {profile?.full_name || "İsimsiz"}
                        {isOwner && <span style={{ fontSize: "0.6rem", color: "#f59e0b", marginLeft: "6px", fontWeight: 700 }}>👑 Sen</span>}
                      </p>
                      <p style={{ fontSize: "0.7rem", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3, marginTop: "1px" }}>
                        {profile?.title || profile?.email || ""}
                      </p>
                    </div>
                  </div>

                  {/* Sağ taraf: Direkt Kaldır Butonu */}
                  {!isOwner && (
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleRemoveMember(member.id, profile?.full_name || profile?.email);
                      }}
                      title="Takımdan Çıkar"
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        background: "#fef2f2",
                        color: "#ef4444",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.transform = "scale(1.05)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.transform = "scale(1)"; }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}

            {members.length === 0 && !fetchLoading && (
              <div style={{ textAlign: "center", padding: "20px 0", fontSize: "0.8rem", color: "#94a3b8" }}>
                Henüz takım üyesi yok
              </div>
            )}
          </div>

          {/* ====== ÇIKIŞ YAP ====== */}
          <div style={{ borderTop: "1px solid #f1f5f9", padding: "10px 18px" }}>
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                padding: "10px",
                borderRadius: "10px",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#ef4444",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
            >
              <LogOut size={15} />
              Çıkış Yap
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
