"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Save, Trash2, AlignLeft, Calendar, Flag, User } from "lucide-react";
import { PRIORITIES } from "@/lib/utils";

export default function TaskModal({ task, boardId, onClose, onUpdate, onDelete, teamMembers: propTeamMembers }) {
  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description_html || "");
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : "");
  const [priority, setPriority] = useState(task.priority || "none");
  const [assigneeId, setAssigneeId] = useState(task.assignee_id || "");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [teamMembers, setTeamMembers] = useState(propTeamMembers || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!propTeamMembers) fetchMembers();
  }, [boardId, propTeamMembers]);

  const fetchMembers = async () => {
    if (!boardId) return;
    try {
      const { data: mData } = await supabase.from("board_members").select("user_id").eq("board_id", boardId);
      if (mData?.length) {
        const { data: pData } = await supabase.from("profiles").select("id, full_name, email").in("id", mData.map(m => m.user_id));
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
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>

      <div
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-[850px] relative overflow-hidden flex flex-col max-h-[95vh]"
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

        {/* ANA İÇERİK - Modal küçüldüğü için boşluklar orantılı azaltıldı */}
        <div style={{ padding: "40px 48px", overflowY: "auto", flex: 1 }}>

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
                style={{ padding: "40px" }}
              />
            </div>

            {/* SAĞ SÜTUN - Kontroller */}
            <div style={{ width: "220px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "20px" }}>

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
                  style={{ colorScheme: "light", padding: "0 28px" }}
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
                    {assigneeId ? (
                      <>
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#dbeafe", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem" }}>
                          {teamMembers.find(m => m.id === assigneeId)?.avatar_url ? (
                            <img src={teamMembers.find(m => m.id === assigneeId).avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            (teamMembers.find(m => m.id === assigneeId)?.full_name?.[0] || teamMembers.find(m => m.id === assigneeId)?.email?.[0] || "?").toUpperCase()
                          )}
                        </div>
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {teamMembers.find(m => m.id === assigneeId)?.full_name || teamMembers.find(m => m.id === assigneeId)?.email}
                        </span>
                      </>
                    ) : (
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
                      {teamMembers.map(m => (
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
                          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#dbeafe", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem" }}>
                            {m.avatar_url ? (
                              <img src={m.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              (m.full_name?.[0] || m.email?.[0] || "?").toUpperCase()
                            )}
                          </div>
                          {m.full_name || m.email}
                        </button>
                      ))}
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
                  onClick={() => { if (window.confirm("Silinsin mi?")) onDelete(task.id); onClose(); }}
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