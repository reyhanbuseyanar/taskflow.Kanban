"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Plus, Trash2, Briefcase, StickyNote, Users2, X, LogOut, Archive,
  ArrowRight, CalendarDays, Clock, AlertCircle, ChevronRight, ChevronDown, Pencil, GripVertical, Layout, Sparkles, FolderOpen
} from "lucide-react";

const ICON_MAP = {
  Briefcase, Users2, StickyNote, Layout, CalendarDays, Clock, Sparkles, FolderOpen
};

const DASHBOARD_COLUMNS = [
  { key: "project", title: "Projeler", icon: Briefcase, color: "#6366f1" },
  { key: "meeting", title: "Toplantılar", icon: Users2, color: "#22c55e" },
  { key: "daily", title: "Etkinlikler & Notlar", icon: StickyNote, color: "#f59e0b" },
];

import Sidebar from "@/components/Sidebar";
import MemberList from "@/components/MemberList";

// Sürükle-bırak (Dnd-Kit)
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";

// Yardımcı pozisyon hesabı
function calculatePosition(before, after) {
  if (before == null && after == null) return 1.0;
  if (before == null) return after / 2.0;
  if (after == null) return before + 1.0;
  if (before === after) return before + 0.1;
  return (before + after) / 2.0;
}

function getBoardType(board) {
  if (board.type) return board.type;
  const t = board.columns?.map(c => c.title.toLowerCase()).join(" ") || "";
  if (t.includes("notlar") || t.includes("bugün")) return "daily";
  if (t.includes("planlanan") || t.includes("hazırlık") || t.includes("toplantı")) return "meeting";
  return "project";
}

function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

// --- DND BİLEŞENLERİ ---

function SortableBoardCard({ board, boardTasks, colColor, onRenameClick, onArchiveClick, onDelete, onNavigate }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: board.id,
    data: { type: "board", board }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 100 : 1,
    position: "relative"
  };

  return (
    <div ref={setNodeRef} style={{ ...style, marginBottom: "4px" }}>
      <div
        {...attributes}
        {...listeners}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderRadius: "14px",
          background: "white", border: "1px solid #e2e8f0",
          transition: "all 0.15s ease", marginBottom: "10px",
          cursor: isDragging ? "grabbing" : "grab",
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        }}
        onMouseOver={e => { e.currentTarget.style.borderColor = colColor; e.currentTarget.style.boxShadow = `0 6px 16px ${colColor}12`; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseOut={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"; e.currentTarget.style.transform = "translateY(0)"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1 }}>
          <div style={{ width: "4px", height: "32px", borderRadius: "4px", background: colColor }} />
          <div
            onClick={(e) => { e.stopPropagation(); onNavigate(board.id); }}
            style={{ cursor: "pointer", flex: 1 }}
          >
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.2px" }}>{board.title}</div>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 500, marginTop: "1px" }}>{boardTasks.length} görev</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); onRenameClick(board.id, board.title); }}
            style={{ background: "#f8fafc", border: "none", cursor: "pointer", color: "#94a3b8", width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.color = "#6366f1"; e.currentTarget.style.background = "#eef2ff"; }}
            onMouseOut={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "#f8fafc"; }}
          >
            <Pencil size={16} />
          </button>
          {/* Arşivle / Arşivden Çıkar Butonu */}
          <button
            onClick={(e) => { e.stopPropagation(); onArchiveClick(board); }}
            title={board.is_archived ? "Arşivden Çıkar" : "Arşivle"}
            style={{
              background: board.is_archived ? "#fef3c7" : "#f8fafc",
              border: "none",
              cursor: "pointer",
              color: board.is_archived ? "#d97706" : "#94a3b8",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
            onMouseOver={e => {
              e.currentTarget.style.color = "#f59e0b";
              e.currentTarget.style.background = "#fffbeb";
            }}
            onMouseOut={e => {
              e.currentTarget.style.color = board.is_archived ? "#d97706" : "#94a3b8";
              e.currentTarget.style.background = board.is_archived ? "#fef3c7" : "#f8fafc";
            }}
          >
            <Archive size={16} />
          </button>
          <button
            onClick={(e) => onDelete(e, board.id)}
            style={{ background: "#f8fafc", border: "none", cursor: "pointer", color: "#94a3b8", width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "#fef2f2"; }}
            onMouseOut={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "#f8fafc"; }}
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            style={{ background: "#f1f5f9", border: "none", cursor: "pointer", color: "#0f172a", width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", marginLeft: "2px" }}
            onMouseOver={e => { e.currentTarget.style.background = "#e2e8f0"; }}
            onMouseOut={e => { e.currentTarget.style.background = "#f1f5f9"; }}
            title="Görevleri Göster/Gizle"
          >
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </div>

      {isExpanded && boardTasks.map(task => {
        const days = daysUntil(task.due_date);
        const isUrgent = days >= 0 && days <= 2;
        const isOverdue = days < 0;

        return (
          <div
            key={task.id}
            onClick={() => onNavigate(board.id)}
            style={{
              padding: "10px 14px 10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginLeft: "12px",
              background: isOverdue ? "#fef2f2" : isUrgent ? "#fffbeb" : "transparent",
              borderLeft: `3px solid ${isOverdue ? "#ef4444" : isUrgent ? "#f59e0b" : "#e2e8f0"}`,
              transition: "all 0.15s ease",
            }}
            onMouseOver={e => e.currentTarget.style.background = isOverdue ? "#fee2e2" : isUrgent ? "#fef3c7" : "#f1f5f9"}
            onMouseOut={e => e.currentTarget.style.background = isOverdue ? "#fef2f2" : isUrgent ? "#fffbeb" : "transparent"}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: "0.8rem", fontWeight: 500, color: "#334155",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {task.title}
              </div>
              <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: "2px" }}>
                {task.columnName}
              </div>
            </div>

            {task.due_date && (
              <div style={{
                fontSize: "0.65rem", fontWeight: 700, flexShrink: 0,
                padding: "3px 8px", borderRadius: "6px",
                background: isOverdue ? "#ef4444" : isUrgent ? "#f59e0b" : "#f1f5f9",
                color: isOverdue || isUrgent ? "white" : "#64748b",
                display: "flex", alignItems: "center", gap: "3px",
              }}>
                {(isOverdue || isUrgent) && <AlertCircle size={10} />}
                {formatDate(task.due_date)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DroppableDashboardColumn({ column, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${column.key}`,
    data: { type: "column", colKey: column.key }
  });

  return (
    <div ref={setNodeRef} style={{
      flex: 1, overflowY: "auto", padding: "8px 12px",
      display: "flex", flexDirection: "column", gap: "6px",
      background: isOver ? "#f1f5f9" : "#fafbfc",
      transition: "background 0.2s ease"
    }}>
      {children}
    </div>
  );
}

// --- ANA SAYFA ---

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const [boards, setBoards] = useState([]);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activeBoard, setActiveBoard] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameData, setRenameData] = useState({ id: null, title: "" });
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveData, setArchiveData] = useState({ id: null, title: "", is_archived: false });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  useEffect(() => {
    setShowArchived(view === "archived");
  }, [view]);

  useEffect(() => {
    setIsMounted(true);
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      setUser(session.user);
      await fetchData(session.user.id);
    };
    init();
  }, [router]);

  const fetchData = async (userId) => {
    const { data } = await supabase
      .from("boards")
      .select("*, columns(id, title, tasks(id, title, due_date, color, position))")
      .eq("user_id", userId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    let fetchedBoards = data || [];

    // Auto-migration: Eğer position'ı 0 olan board'lar varsa, bunlara otomatik pozisyon ata
    const hasZeros = fetchedBoards.some(b => b.position === 0);
    if (hasZeros) {
      const updates = [];
      const tempGrouped = {};
      DASHBOARD_COLUMNS.forEach(c => { tempGrouped[c.key] = []; });

      fetchedBoards.forEach(b => {
        const type = getBoardType(b);
        if (!tempGrouped[type]) tempGrouped[type] = [];
        tempGrouped[type].push(b);
      });

      Object.keys(tempGrouped).forEach(type => {
        tempGrouped[type].forEach((b, i) => {
          if (b.position === 0) {
            const newPos = (i + 1) * 1.0;
            b.position = newPos;
            b.type = type;
            updates.push(supabase.from("boards").update({ position: newPos, type }).eq("id", b.id));
          }
        });
      });

      if (updates.length > 0) {
        await Promise.all(updates);
      }

      fetchedBoards.sort((a, b) => a.position - b.position);
    }

    setBoards(fetchedBoards);
    setLoading(false);
  };

  const createBoard = async () => {
    if (!newBoardTitle.trim() || !user || !selectedTemplate) return;

    // Yeni pozisyon hesapla
    const colBoards = boards.filter(b => getBoardType(b) === selectedTemplate).sort((a, b) => (a.position || 0) - (b.position || 0));
    const lastPos = colBoards.length > 0 ? colBoards[colBoards.length - 1].position || 0 : 0;
    const newPos = calculatePosition(lastPos, null);

    const { data, error } = await supabase.from("boards").insert({
      title: newBoardTitle.trim(),
      user_id: user.id,
      type: selectedTemplate,
      position: newPos
    }).select().single();

    if (error) {
      alert("Hata oluştu! Muhtemelen SQL kodunu Supabase'de çalıştırmadınız. Hata detayı: " + error.message);
      return;
    }

    if (data) {
      // Pano sahibini board_members'a ekle (Senkronizasyon için kritik)
      await supabase.from("board_members").insert({
        board_id: data.id,
        user_id: user.id,
        role: "owner"
      });

      // Varsayılan sütunları oluştur
      const defaultCols = ["Yapılacak", "Devam Eden", "Tamamlandı"];
      await supabase.from("columns").insert(defaultCols.map((title, i) => ({ board_id: data.id, title, position: (i + 1) * 1.0 })));
      await fetchData(user.id);
      setNewBoardTitle(""); setShowNewBoard(false); setSelectedTemplate(null);
    }
  };

  const deleteBoard = async (e, boardId) => {
    e.preventDefault(); e.stopPropagation();
    setBoards(boards.filter(b => b.id !== boardId));
    try {
      const { data: cols } = await supabase.from("columns").select("id").eq("board_id", boardId);
      if (cols && cols.length > 0) {
        const colIds = cols.map(c => c.id);
        const { data: tsks } = await supabase.from("tasks").select("id").in("column_id", colIds);
        if (tsks && tsks.length > 0) {
          await supabase.from("checklists").delete().in("task_id", tsks.map(t => t.id));
        }
        await supabase.from("tasks").delete().in("column_id", colIds);
        await supabase.from("columns").delete().eq("board_id", boardId);
      }
      const { error } = await supabase.from("boards").delete().eq("id", boardId);
      if (error) throw error;
    } catch (err) {
      alert("Silme hatası: " + err.message);
      await fetchData(user.id);
    }
  };

  const handleRenameSubmit = async () => {
    if (!renameData.title.trim()) return;
    setBoards(boards.map(b => b.id === renameData.id ? { ...b, title: renameData.title.trim() } : b));
    setShowRenameModal(false);
    const { error } = await supabase.from("boards").update({ title: renameData.title.trim() }).eq("id", renameData.id);
    if (error) {
      alert("Güncelleme hatası: " + error.message);
      await fetchData(user.id);
    }
  };

  const handleArchiveSubmit = async () => {
    const { error } = await supabase.from("boards").update({ is_archived: !archiveData.is_archived }).eq("id", archiveData.id);
    setShowArchiveModal(false);
    if (error) {
      alert("Hata oluştu: " + error.message + "\n\nNot: Veritabanında 'is_archived' sütunu bulunmuyor olabilir.");
    } else {
      await fetchData(user.id);
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const board = boards.find(b => b.id === active.id);
    setActiveBoard(board || null);
  };

  const handleDragEnd = async (event) => {
    setActiveBoard(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeBoard = boards.find(b => b.id === activeId);
    if (!activeBoard) return;

    let targetColKey = null;
    let newPos = activeBoard.position;

    const isOverBoard = over.data.current?.type === "board";
    const isOverColumn = over.data.current?.type === "column";

    // KOPYASINI AL
    let newBoards = [...boards];

    if (isOverBoard) {
      const overBoard = boards.find(b => b.id === overId);
      targetColKey = getBoardType(overBoard);

      const colBoards = newBoards.filter(b => getBoardType(b) === targetColKey).sort((a, b) => (a.position || 0) - (b.position || 0));
      const overIndex = colBoards.findIndex(b => b.id === overId);
      const activeIndex = colBoards.findIndex(b => b.id === activeId);

      let beforePos = null;
      let afterPos = null;

      if (activeIndex !== -1 && activeIndex < overIndex) {
        beforePos = colBoards[overIndex].position || 0;
        afterPos = overIndex + 1 < colBoards.length ? (colBoards[overIndex + 1].position || 0) : null;
      } else {
        afterPos = colBoards[overIndex].position || 0;
        beforePos = overIndex - 1 >= 0 ? (colBoards[overIndex - 1].position || 0) : null;
      }
      newPos = calculatePosition(beforePos, afterPos);

    } else if (isOverColumn) {
      targetColKey = over.data.current.colKey;
      const colBoards = newBoards.filter(b => getBoardType(b) === targetColKey).sort((a, b) => (a.position || 0) - (b.position || 0));
      const lastPos = colBoards.length > 0 ? colBoards[colBoards.length - 1].position || 0 : 0;
      newPos = calculatePosition(lastPos, null);
    } else {
      return;
    }

    // STATE GÜNCELLE
    setBoards(prev => prev.map(b => b.id === activeId ? { ...b, type: targetColKey, position: newPos } : b));

    // VERİTABANI GÜNCELLE
    await supabase.from("boards").update({ type: targetColKey, position: newPos }).eq("id", activeId);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 400, tolerance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const grouped = {};
  DASHBOARD_COLUMNS.forEach(col => { grouped[col.key] = []; });

  boards.filter(b => showArchived ? b.is_archived : !b.is_archived).forEach(b => {
    const type = getBoardType(b);
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(b);
  });

  Object.keys(grouped).forEach(k => {
    grouped[k].sort((a, b) => (a.position || 0) - (b.position || 0));
  });

  let totalTasks = 0;
  let urgentCount = 0;
  boards.filter(b => !b.is_archived).forEach(b => b.columns?.forEach(c => {
    totalTasks += c.tasks.length;
    c.tasks.forEach(t => { if (daysUntil(t.due_date) <= 2 && daysUntil(t.due_date) >= 0) urgentCount++; });
  }));

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading || !isMounted) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ width: "36px", height: "36px", border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content" style={{ background: "#f1f5f9", display: "flex", flexDirection: "column" }}>

        <div style={{
          padding: isMobile ? "16px" : "20px 36px",
          background: "white",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          gap: isMobile ? "12px" : "0"
        }}>
          <div>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>Görev Merkezi</h1>
            <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "2px" }}>
              {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })} · {boards.length} board · {totalTasks} görev
              {urgentCount > 0 && <span style={{ color: "#ef4444", fontWeight: 700 }}> · {urgentCount} acil!</span>}
            </p>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            width: isMobile ? "100%" : "auto",
            justifyContent: isMobile ? "space-between" : "flex-end"
          }}>
            <MemberList boardId={null} currentUserId={user?.id} />
            <button
              onClick={() => setShowNewBoard(true)}
              className="btn btn-primary"
              style={{ width: isMobile ? "100%" : "auto" }}
            >
              <Plus size={18} /> Yeni Ekle
            </button>
          </div>
        </div>

        <div className="board-grid-premium" style={{ flex: 1, display: "grid", height: "100%" }}>
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {DASHBOARD_COLUMNS.map((col, index) => {
              const colBoards = grouped[col.key] || [];
              const allTasks = [];
              colBoards.forEach(b => b.columns?.forEach(c => c.tasks.forEach(t => allTasks.push({ ...t, boardName: b.title, boardId: b.id, columnName: c.title }))));
              const IconComp = col.icon;

              return (
                <div
                  key={col.key}
                  style={{
                    borderRight: index === DASHBOARD_COLUMNS.length - 1 ? "none" : "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    background: "white",
                    height: "100%"
                  }}
                >
                  <div style={{ padding: "14px 20px 10px", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${col.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <IconComp size={16} color={col.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{col.title}</div>
                        <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>{allTasks.length} görev · {colBoards.length} pano</div>
                      </div>
                    </div>
                  </div>

                  <DroppableDashboardColumn column={col}>
                    <SortableContext items={colBoards.map(b => b.id)} strategy={verticalListSortingStrategy}>
                      {colBoards.map(board => {
                        const boardTasks = [];
                        board.columns?.forEach(c => c.tasks.forEach(t => boardTasks.push({ ...t, columnName: c.title })));
                        return (
                          <SortableBoardCard
                            key={board.id}
                            board={board}
                            boardTasks={boardTasks}
                            colColor={col.color}
                            onRenameClick={(id, title) => { setRenameData({ id, title }); setShowRenameModal(true); }}
                            onArchiveClick={(board) => { setArchiveData(board); setShowArchiveModal(true); }}
                            onDelete={deleteBoard}
                            onNavigate={(id) => router.push(`/board/${id}`)}
                          />
                        );
                      })}
                    </SortableContext>

                    <div
                      onClick={() => { setSelectedTemplate(col.key); setShowNewBoard(true); }}
                      style={{
                        display: "flex", flexDirection: colBoards.length === 0 ? "column" : "row",
                        alignItems: "center", justifyContent: "center", gap: colBoards.length === 0 ? "8px" : "6px",
                        color: "#94a3b8", cursor: "pointer", borderRadius: "12px", border: "2px dashed #e2e8f0",
                        padding: colBoards.length === 0 ? "24px 16px" : "10px", marginTop: "6px", transition: "all 0.2s ease",
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = col.color; e.currentTarget.style.color = col.color; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#94a3b8"; }}
                    >
                      <Plus size={colBoards.length === 0 ? 28 : 18} />
                      <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{colBoards.length === 0 ? "Henüz pano yok" : "Yeni Ekle"}</div>
                    </div>
                  </DroppableDashboardColumn>
                </div>
              );
            })}

            <DragOverlay>
              {activeBoard ? (
                <div style={{ background: "white", padding: "10px 14px", borderRadius: "10px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0", opacity: 0.9 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a" }}>{activeBoard.title}</div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </main>

      {/* Yeni Board Ekleme Modalı */}
      {showNewBoard && (
        <div className="modal-overlay" onClick={() => { setShowNewBoard(false); setSelectedTemplate(null); setNewBoardTitle(""); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Yeni Pano Oluştur</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => { setShowNewBoard(false); setSelectedTemplate(null); setNewBoardTitle(""); }}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {!selectedTemplate ? (
                <div>
                  <label className="form-label">ŞABLON SEÇİN</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                    {DASHBOARD_COLUMNS.map(tpl => (
                      <div
                        key={tpl.key}
                        onClick={() => setSelectedTemplate(tpl.key)}
                        style={{
                          padding: "14px", border: "2px solid #e2e8f0", borderRadius: "10px",
                          display: "flex", alignItems: "center", gap: "12px", cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseOver={e => { e.currentTarget.style.borderColor = tpl.color; e.currentTarget.style.background = `${tpl.color}05`; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "white"; }}
                      >
                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${tpl.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <tpl.icon size={20} color={tpl.color} />
                        </div>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>{tpl.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">PANO ADI</label>
                  <input
                    className="input"
                    placeholder="Örn: Pazarlama Kampanyası, Haftalık Plan..."
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createBoard()}
                    autoFocus
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              {selectedTemplate && (
                <button className="btn btn-ghost" onClick={() => setSelectedTemplate(null)} style={{ marginRight: "auto" }}>Geri</button>
              )}
              <button className="btn btn-secondary" onClick={() => { setShowNewBoard(false); setSelectedTemplate(null); setNewBoardTitle(""); }}>İptal</button>
              {selectedTemplate && (
                <button className="btn btn-primary" onClick={createBoard} disabled={!newBoardTitle.trim()}>Oluştur</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Panoyu Yeniden Adlandır</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowRenameModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">YENİ PANO ADI</label>
                <input
                  className="input"
                  value={renameData.title}
                  onChange={(e) => setRenameData({ ...renameData, title: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRenameModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleRenameSubmit} disabled={!renameData.title.trim()}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="modal-overlay" onClick={() => setShowArchiveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>{archiveData.is_archived ? "Arşivden Çıkar" : "Arşive Kaldır"}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowArchiveModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: "1.5" }}>
                <strong>"{archiveData.title}"</strong> panosunu {archiveData.is_archived ? "arşivden çıkarmak" : "arşive kaldırmak"} istediğinize emin misiniz?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowArchiveModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleArchiveSubmit}>Evet, Onaylıyorum</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="auth-container">Yükleniyor...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
