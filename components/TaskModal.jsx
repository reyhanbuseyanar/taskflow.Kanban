"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Save, Trash2, AlignLeft, Calendar, Flag, User } from "lucide-react";
import { PRIORITIES } from "@/lib/utils";

const AVATAR_BG_COLORS = [
  "#dbeafe", "#fce7f3", "#d1fae5", "#fef3c7",
  "#ede9fe", "#ffe4e6", "#cffafe", "#e0e7ff",
];
const AVATAR_TEXT_COLORS = [
  "#2563eb", "#db2777", "#059669", "#d97706",
  "#7c3aed", "#e11d48", "#0891b2", "#4f46e5",
];

function getColorForUser(userId) {
  if (!userId) return { bg: "#f1f5f9", text: "#94a3b8" };
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

export default function TaskModal({ task, boardId, boardTitle, onClose, onUpdate, onDelete, teamMembers: propTeamMembers }) {
  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description_html || "");
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : "");
  const [priority, setPriority] = useState(task.priority || "none");
  const [assigneeId, setAssigneeId] = useState(task.assignee_id || "");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [teamMembers, setTeamMembers] = useState(propTeamMembers || []);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (propTeamMembers && propTeamMembers.length > 0) {
      setTeamMembers(propTeamMembers);
    } else if (boardId) {
      fetchMembers();
    }

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [boardId, propTeamMembers]);

  const fetchMembers = async () => {
    if (!boardId) return;
    try {
      const { data: boardData } = await supabase.from("boards").select("user_id").eq("id", boardId).single();
      const { data: mData } = await supabase.from("board_members").select("user_id").eq("board_id", boardId);

      const allIds = [...new Set([boardData?.user_id, ...(mData || []).map(m => m.user_id)].filter(Boolean))];

      if (allIds.length) {
        const { data: pData } = await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", allIds);
        if (pData) setTeamMembers(pData);
      }
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    setSaving(true);
    const updateData = { title, description_html: description, due_date: dueDate || null, priority, assignee_id: assigneeId || null };
    const { error } = await supabase.from("tasks").update(updateData).eq("id", task.id);

    if (!error) {
      const selectedProfile = teamMembers.find(m => m.id === assigneeId);
      onUpdate({
        ...task,
        ...updateData,
        assignee_profile: selectedProfile || null
      });
    }

    setSaving(false);
    onClose();
  };

  const activePriority = PRIORITIES.find(p => p.id === priority) || PRIORITIES[0];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-6 sm:p-6" onClick={onClose}>

      <div
        className="bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl w-[92%] sm:w-full max-w-[850px] relative overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[95vh]"
        style={{ animation: "slideDown 0.15s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dinamik Üst Şerit */}
        <div className="absolute top-0 left-0 w-full h-2 transition-colors duration-300" style={{ background: activePriority.color }} />

        {/* Kapatma Butonu */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all z-10"
        >
          <X size={24} strokeWidth={2.5} />
        </button>

        {/* ANA İÇERİK */}
        <div
          className="overflow-y-auto flex-1"
          style={{
            padding: isMobile ? "24px 20px 100px" : "40px 48px",
          }}
        >

          {/* Breadcrumb - Board İsmi */}
          <div style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" }}>Panolar</span>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#cbd5e1" }}>/</span>
            <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px", background: "rgba(99, 102, 241, 0.1)", padding: "2px 8px", borderRadius: "6px" }}>{boardTitle || "Pano"}</span>
          </div>

          {/* Başlık Bölümü */}
          <div style={{ marginBottom: "28px" }}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-[32px] font-extrabold text-slate-800 bg-transparent border-none outline-none placeholder:text-slate-200 leading-tight"
              style={{ fontFamily: "Georgia, serif", letterSpacing: "-1px" }}
              placeholder="Görev Başlığı Girin"
            />
          </div>

          <div style={{ display: "flex", gap: "36px", alignItems: "stretch", flexWrap: "wrap" }}>

            {/* SOL SÜTUN - Açıklama */}
            <div style={{ flex: "1 1 250px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="flex items-center gap-2 text-slate-500 font-bold text-[13px] tracking-widest uppercase ml-1">
                <AlignLeft size={16} />
                Açıklama
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Görev detaylarını ve notlarınızı buraya ekleyin..."
                className="w-full flex-1 min-h-[260px] bg-slate-50 border-2 border-slate-100 hover:border-slate-200 rounded-[24px] text-slate-600 text-[14px] leading-relaxed resize-none outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                style={{ padding: isMobile ? "20px" : "40px" }}
              />
            </div>

            {/* SAĞ SÜTUN - Kontroller */}
            <div style={{ width: isMobile ? "100%" : "220px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Öncelik */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label className="text-[11.5px] font-bold text-slate-500 flex items-center gap-2 tracking-widest uppercase ml-1">
                  <Flag size={14} /> Öncelik
                </label>
                <div className="relative">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full h-12 appearance-none bg-white border-2 border-slate-200 rounded-2xl text-[14.5px] font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 shadow-sm cursor-pointer transition-all"
                    style={{ padding: "0 28px" }}
                  >
                    <option value="none"> ⚪ Belirlenmedi</option>
                    <option value="low"> 🟢  Düşük</option>
                    <option value="medium"> 🟡  Orta</option>
                    <option value="high"> 🔴  Yüksek</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>
              </div>

              {/* Teslim Tarihi */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label className="text-[11.5px] font-bold text-slate-500 flex items-center gap-2 tracking-widest uppercase ml-1">
                  <Calendar size={14} /> Teslim Tarihi
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-12 bg-white border-2 border-slate-200 rounded-2xl text-[14.5px] font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 shadow-sm cursor-pointer transition-all"
                  style={{ 
                    colorScheme: "light", 
                    padding: "0 28px", 
                    display: "block", 
                    boxSizing: "border-box",
                    minWidth: "0" // Mobilde taşmayı önlemek için
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label className="text-[11.5px] font-bold text-slate-500 flex items-center gap-2 tracking-widest uppercase ml-1">
                  <User size={14} /> Sorumlu
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                    className="w-full h-12 bg-white border-2 border-slate-200 rounded-2xl flex items-center gap-5 text-[14.5px] font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 shadow-sm cursor-pointer transition-all"
                    style={{ padding: "0 28px" }}
                  >
                    {assigneeId ? (() => {
                      const selected = teamMembers.find(m => m.id === assigneeId);
                      const color = getColorForUser(assigneeId);
                      const initials = getInitials(selected?.full_name, selected?.email);
                      return (
                        <>
                          <div style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: color.bg,
                            color: color.text,
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            border: "1.5px solid white",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                          }}>
                            {selected?.avatar_url ? (
                              <img src={selected.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              initials
                            )}
                          </div>
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {selected?.full_name || selected?.email}
                          </span>
                        </>
                      );
                    })() : (
                      <span className="text-slate-400">👤 Atanmadı</span>
                    )}
                    <div className="ml-auto text-slate-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showAssigneeDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </button>

                  {showAssigneeDropdown && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        left: 0,
                        right: 0,
                        background: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "16px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                        zIndex: 100,
                        padding: "6px",
                        maxHeight: "200px",
                        overflowY: "auto",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => { setAssigneeId(""); setShowAssigneeDropdown(false); }}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          borderRadius: "10px",
                          border: "none",
                          background: assigneeId === "" ? "#f1f5f9" : "none",
                          color: "#64748b",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <User size={12} />
                        </div>
                        Atanmadı
                      </button>
                      {teamMembers.map(m => {
                        const color = getColorForUser(m.id);
                        const initials = getInitials(m.full_name, m.email);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { setAssigneeId(m.id); setShowAssigneeDropdown(false); }}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              borderRadius: "10px",
                              border: "none",
                              background: assigneeId === m.id ? "#eff6ff" : "none",
                              color: assigneeId === m.id ? "#3b82f6" : "#1e293b",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              textAlign: "left",
                              marginTop: "2px",
                            }}
                          >
                            <div style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              background: color.bg,
                              color: color.text,
                              overflow: "hidden",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.65rem",
                              fontWeight: 800,
                              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                            }}>
                              {m.avatar_url ? (
                                <img src={m.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                initials
                              )}
                            </div>
                            {m.full_name || m.email}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Ayraç */}
              <div className="border-t border-slate-100 my-1 w-full" />

              {/* Aksiyon Butonları */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                <button
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="w-full h-12 text-white text-[14px] font-bold rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                  style={{ background: activePriority.id === 'none' ? '#2563eb' : activePriority.color }}
                >
                  <Save size={16} /> Kaydet
                </button>
                <button
                  onClick={async () => {
                    await onDelete(task.id);
                  }}
                  className="w-full h-12 bg-red-50 hover:bg-red-100 text-red-600 text-[14px] font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Kartı Sil
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}