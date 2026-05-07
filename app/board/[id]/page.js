"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { supabase } from "@/lib/supabase";
import { calculatePosition, getDueDateStatus } from "@/lib/utils";
import Column from "@/components/Column";
import TaskCard from "@/components/TaskCard";
import TaskModal from "@/components/TaskModal";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import FilterPanel from "@/components/FilterPanel";
import MemberList from "@/components/MemberList";
import { ArrowLeft, Plus, Sparkles, Users, Filter, X, BarChart3, ClipboardList, PencilLine, CheckCircle2, Clock, SearchX } from "lucide-react";
import confetti from "canvas-confetti";

const COLUMN_COLORS = ["#65aff0ff", "#f59e0b", "#22c55e", "#8b5cf6"];

export default function BoardPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.id;

  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState(null);

  // Yeni Sütun Modalı State
  const [showNewColumnModal, setShowNewColumnModal] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newColumnColor, setNewColumnColor] = useState(COLUMN_COLORS[0]);

  // Özet (Summary) Modalı State
  const [showSummary, setShowSummary] = useState(false);

  // 🔍 Arama & Filtreleme state
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState([]);
  const [filters, setFilters] = useState({
    priority: "all",
    assignee: "all",
    dueDate: "all",
  });

  // Optimistic Update: Rollback için önceki durumu saklama
  const previousTasksRef = useRef([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 400, tolerance: 10 } })
  );

  // Kanban için en iyisi closestCorners'dır
  const collisionDetection = closestCorners;

  const refreshMembers = useCallback(async (ownerId) => {
    const { data: mData } = await supabase
      .from("board_members")
      .select("user_id")
      .eq("board_id", boardId);

    const allMemberIds = [...new Set([ownerId || board?.user_id, ...(mData || []).map(m => m.user_id)].filter(Boolean))];

    if (allMemberIds.length > 0) {
      const { data: pData } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", allMemberIds);
      setMembers(pData || []);
    }
  }, [boardId, board?.user_id]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      setUser(session.user);

      const { data: boardData } = await supabase.from("boards").select("*").eq("id", boardId).single();
      if (!boardData) { router.push("/dashboard"); return; }
      setBoard(boardData);

      const { data: colData } = await supabase
        .from("columns")
        .select("*")
        .eq("board_id", boardId)
        .order("position", { ascending: true });
      setColumns(colData || []);

      const colIds = (colData || []).map((c) => c.id);
      if (colIds.length > 0) {
        const { data: taskData } = await supabase
          .from("tasks")
          .select("*, checklists(*)")
          .in("column_id", colIds)
          .order("position", { ascending: true });

        // Assignee profil bilgilerini çek
        const tasksWithAssignee = taskData || [];
        const assigneeIds = [...new Set(tasksWithAssignee.filter(t => t.assignee_id).map(t => t.assignee_id))];
        let profileMap = {};
        if (assigneeIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email, avatar_url")
            .in("id", assigneeIds);
          if (profiles) {
            profiles.forEach(p => { profileMap[p.id] = p; });
          }
        }
        const enrichedTasks = tasksWithAssignee.map(t => ({
          ...t,
          assignee_profile: t.assignee_id ? profileMap[t.assignee_id] || null : null,
        }));
        setTasks(enrichedTasks);
      }

      await refreshMembers(boardData.user_id);

      setLoading(false);
      setIsMounted(true);
    };
    fetchData();

    // Supabase Realtime (Canlı Güncelleme)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          fetchData();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [boardId, router]);

  // 🔍 Kart filtreleme mantığı
  const isTaskMatching = useCallback((task) => {
    // Arama filtresi (Başlık + Sorumlu İsmi/E-postası)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(q);
      const assigneeNameMatch = task.assignee_profile?.full_name?.toLowerCase().includes(q);
      const assigneeEmailMatch = task.assignee_profile?.email?.toLowerCase().includes(q);

      if (!titleMatch && !assigneeNameMatch && !assigneeEmailMatch) {
        return false;
      }
    }

    // Öncelik filtresi
    if (filters.priority !== "all") {
      const taskPriority = task.priority || "none";
      if (taskPriority !== filters.priority) return false;
    }

    // Sorumlu filtresi
    if (filters.assignee !== "all") {
      if (task.assignee_id !== filters.assignee) return false;
    }

    // Tarih filtresi
    if (filters.dueDate !== "all") {
      const status = getDueDateStatus(task.due_date);
      if (filters.dueDate === "overdue" && status !== "overdue") return false;
      if (filters.dueDate === "today" && status !== "soon") return false;
      if (filters.dueDate === "week") {
        if (!task.due_date) return false;
        const diff = (new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (diff < 0 || diff > 7) return false;
      }
    }

    return true;
  }, [searchQuery, filters]);

  // --- ÖZET (SUMMARY) MANTIĞI ---
  const summaryStats = useMemo(() => {
    const totalCards = tasks.length;

    // Sütun başlıklarına göre filtreleme
    const doneColumnIds = columns.filter(col => {
      const t = col.title.toLowerCase();
      return t.includes('bitti') || t.includes('tamamlandı') || t.includes('done');
    }).map(c => c.id);
    const doneCount = tasks.filter(t => doneColumnIds.includes(t.column_id)).length;

    const todoColumnIds = columns.filter(col => {
      const t = col.title.toLowerCase();
      return t.includes('yapılacak') || t.includes('todo') || t.includes('bekleyen');
    }).map(c => c.id);
    const todoCount = tasks.filter(t => todoColumnIds.includes(t.column_id)).length;

    const inProgressColumnIds = columns.filter(col => {
      const t = col.title.toLowerCase();
      return t.includes('yapılıyor') || t.includes('devam') || t.includes('progress');
    }).map(c => c.id);
    const inProgressCount = tasks.filter(t => inProgressColumnIds.includes(t.column_id)).length;

    const otherCount = totalCards - doneCount - todoCount - inProgressCount;

    // Yaklaşan (3 gün için)
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 3);
    const upcomingCount = tasks.filter(card => {
      if (!card.due_date) return false;
      const due = new Date(card.due_date);
      return due >= today && due <= nextWeek;
    }).length;

    return { totalCards, doneCount, todoCount, inProgressCount, otherCount, upcomingCount, doneColumnIds, todoColumnIds, inProgressColumnIds };
  }, [tasks, columns]);

  // Özet kartlarına tıklandığında ilgili sütuna kaydırma
  const scrollToColumnByType = useCallback((type) => {
    let targetColumnId = null;
    if (type === 'done') targetColumnId = summaryStats.doneColumnIds?.[0];
    else if (type === 'todo') targetColumnId = summaryStats.todoColumnIds?.[0];
    else if (type === 'inProgress') targetColumnId = summaryStats.inProgressColumnIds?.[0];
    else if (type === 'upcoming') {
      // Yaklaşan: vadesi en yakın olan görevin sütununa git
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 3);
      const upcomingTask = tasks.find(t => {
        if (!t.due_date) return false;
        const due = new Date(t.due_date);
        return due >= today && due <= nextWeek;
      });
      if (upcomingTask) targetColumnId = upcomingTask.column_id;
    }

    if (!targetColumnId) return;
    setShowSummary(false);
    setTimeout(() => {
      const el = document.querySelector(`[data-column-id="${targetColumnId}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, 150);
  }, [summaryStats, tasks]);

  // Filtre aktif mi?
  const isFilterActive = searchQuery.trim() !== "" ||
    filters.priority !== "all" ||
    filters.assignee !== "all" ||
    filters.dueDate !== "all";

  const getTasksForColumn = useCallback(
    (columnId) => {
      let filtered = tasks.filter((t) => t.column_id === columnId);
      if (isFilterActive) {
        filtered = filtered.filter(t => isTaskMatching(t));
      }
      return filtered.sort((a, b) => a.position - b.position);
    },
    [tasks, isFilterActive, isTaskMatching]
  );
  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);

  // ========== SÜTUN İŞLEMLERİ ==========
  const addColumn = async () => {
    if (!newColumnTitle.trim()) return;

    const lastPos = columns.length > 0 ? columns[columns.length - 1].position : 0;
    const newPos = calculatePosition(lastPos, null);

    const { data, error } = await supabase
      .from("columns")
      .insert({ board_id: boardId, title: newColumnTitle.trim(), position: newPos, color: newColumnColor })
      .select()
      .single();

    if (error) {
      alert("Hata! Muhtemelen veritabanına henüz color sütununu eklemediniz. Lütfen SQL sorgusunu çalıştırın. Hata: " + error.message);
      return;
    }

    if (data) {
      setColumns((prev) => [...prev, data]);
      setShowNewColumnModal(false);
      setNewColumnTitle("");
      setNewColumnColor(COLUMN_COLORS[0]);
    }
  };

  const deleteColumn = async (columnId) => {
    setColumns((prev) => prev.filter((c) => c.id !== columnId));
    setTasks((prev) => prev.filter((t) => t.column_id !== columnId));

    try {
      const { data: tsks } = await supabase.from("tasks").select("id").eq("column_id", columnId);
      if (tsks && tsks.length > 0) {
        await supabase.from("checklists").delete().in("task_id", tsks.map(t => t.id));
      }
      await supabase.from("tasks").delete().eq("column_id", columnId);
      const { error } = await supabase.from("columns").delete().eq("id", columnId);
      if (error) throw error;
    } catch (err) {
      alert("Sütun silinemedi: " + err.message);
      window.location.reload();
    }
  };

  const renameColumn = async (id, title) => {
    await supabase.from("columns").update({ title }).eq("id", id);
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  };

  // ========== KART İŞLEMLERİ ==========
  const addTask = async (columnId, title) => {
    // Burada tasks state'i eski kalabilir, getTasksForColumn fonksiyonunu doğrudan güncel state üzerinden çalıştıramadığımız için
    // pozisyon hesabını mevcut anlık tasks dizisinden yapıyoruz.
    const columnTasks = getTasksForColumn(columnId);
    const lastPos = columnTasks.length > 0 ? columnTasks[columnTasks.length - 1].position : 0;
    const newPos = calculatePosition(lastPos, null);
    const { data, error } = await supabase
      .from("tasks")
      .insert({ column_id: columnId, title, position: newPos, color: "#ffffff" })
      .select("*, checklists(*)")
      .single();

    if (data) {
      setTasks((prevTasks) => [...prevTasks, data]);
    }
  };

  // ========== SÜRÜKLE-BIRAK: DRAG START ==========
  const handleDragStart = (e) => {
    const { active } = e;
    const type = active.data.current?.type;
    setActiveType(type);
    setActiveItem(active.data.current?.[type]);
    previousTasksRef.current = [...tasks];
  };

  // ========== SÜRÜKLE-BIRAK: DRAG OVER ==========
  const handleDragOver = (e) => {
    const { active, over } = e;
    if (!over) return;



    if (active.data.current?.type !== "task") return;

    const activeId = active.id;
    const overId = over.id;
    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    let overColumnId;
    if (over.data.current?.type === "task") {
      overColumnId = tasks.find((t) => t.id === overId)?.column_id;
    } else {
      const overIdStr = overId.toString();
      overColumnId = overIdStr.startsWith("column-droppable-")
        ? overIdStr.replace("column-droppable-", "")
        : overIdStr;
    }

    if (!overColumnId || activeTask.column_id === overColumnId) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeId ? { ...t, column_id: overColumnId } : t
      )
    );
  };

  // ========== SÜRÜKLE-BIRAK: DRAG END ==========
  const handleDragEnd = async (e) => {
    const { active, over } = e;

    setActiveItem(null);
    setActiveType(null);

    if (!over) {
      setTasks(previousTasksRef.current);
      return;
    }

    // ===== ÇÖP KUTUSUNA BIRAKMA =====



    // Sütunun içerisindeki listeden de anında sil (Ekrandan kaybolması için kritik)





    // ===== SÜTUN SIRASI DEĞİŞTİRME =====
    if (active.data.current?.type === "column") {
      if (active.id !== over.id) {
        const oldIdx = columns.findIndex((c) => c.id === active.id);
        const newIdx = columns.findIndex((c) => c.id === over.id);
        if (oldIdx === -1 || newIdx === -1) return;
        const newCols = arrayMove(columns, oldIdx, newIdx).map((c, i) => ({
          ...c,
          position: (i + 1) * 1.0,
        }));
        setColumns(newCols);
        for (const c of newCols) {
          await supabase.from("columns").update({ position: c.position }).eq("id", c.id);
        }
      }
      return;
    }

    // ===== KART TAŞIMA =====
    if (active.data.current?.type === "task") {
      const activeTask = tasks.find((t) => t.id === active.id);
      if (!activeTask) return;

      let targetColumnId;
      if (over.data.current?.type === "task") {
        targetColumnId = tasks.find((t) => t.id === over.id)?.column_id;
      } else {
        const overIdStr = over.id.toString();
        targetColumnId = overIdStr.startsWith("column-droppable-")
          ? overIdStr.replace("column-droppable-", "")
          : overIdStr;
      }
      if (!targetColumnId) targetColumnId = activeTask.column_id;

      const targetTasks = tasks
        .filter((t) => t.column_id === targetColumnId && t.id !== active.id)
        .sort((a, b) => a.position - b.position);

      let newPos;
      if (over.data.current?.type === "task") {
        const idx = targetTasks.findIndex((t) => t.id === over.id);
        if (idx >= 0) {
          const before = idx > 0 ? targetTasks[idx - 1].position : null;
          const after = targetTasks[idx].position;
          newPos = calculatePosition(before, after);
        } else {
          newPos = calculatePosition(
            targetTasks.length > 0 ? targetTasks[targetTasks.length - 1].position : null,
            null
          );
        }
      } else {
        newPos = calculatePosition(
          targetTasks.length > 0 ? targetTasks[targetTasks.length - 1].position : null,
          null
        );
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === active.id
            ? { ...t, column_id: targetColumnId, position: newPos }
            : t
        )
      );

      const { error } = await supabase
        .from("tasks")
        .update({ column_id: targetColumnId, position: newPos })
        .eq("id", active.id);

      if (error) {
        setTasks(previousTasksRef.current);
        return;
      }

      if (activeTask.column_id !== targetColumnId) {
        const colTitle = columns.find((c) => c.id === targetColumnId)?.title?.toLowerCase();
        if (colTitle?.includes("tamamlandı") || colTitle?.includes("done") || colTitle?.includes("bitti")) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      }
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid var(--border-color)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)" }}>Board yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content" style={{ display: "flex", flexDirection: "column" }}>
        {/* Board Header */}
        <div className="board-header-premium">
          <div className="board-header-left">
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => router.push("/dashboard")}
              style={{ background: "#f1f5f9", borderRadius: "10px" }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="board-title-text">{board?.title}</h1>
              <p className="board-subtitle-text">
                {columns.length} sütun · {tasks.length} görev
              </p>
            </div>
            <button
              onClick={() => setShowSummary(true)}
              className="btn btn-secondary btn-summary-mobile"
            >
              <BarChart3 size={18} /> <span>Özet</span>
            </button>
          </div>
          <div className="board-header-right" style={{ flexWrap: "wrap", gap: "8px" }}>
            <MemberList boardId={boardId} currentUserId={user?.id} onUpdate={refreshMembers} />
            <div className="header-separator" />
            <div className="search-filter-group" style={{ flex: 1, minWidth: "200px" }}>
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
              <FilterPanel filters={filters} onFiltersChange={setFilters} tasks={tasks} members={members} />
            </div>
          </div>
        </div>

        {/* ProgressBar kaldırıldı, yerine Özet butonu ve Modalı eklendi */}

        {/* Aktif filtre bilgisi */}


        {/* Board Canvas */}
        {isMounted && (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div
              className="board-container"
              style={{
                padding: "16px 20px",
                background: "var(--bg-board)",
                minHeight: "calc(100vh - 120px)",
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-start",
                gap: "24px",
                overflowX: "auto",
              }}
            >
              <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                {isFilterActive && tasks.filter(t => isTaskMatching(t)).length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '300px', height: '60vh', color: '#64748b', gap: '20px', padding: '0 40px' }}>
                    <SearchX size={56} color="#cbd5e1" />
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, textAlign: 'center' }}>Aradığınız kriterlere uygun görev bulunamadı</p>
                    <button
                      onClick={() => { setSearchQuery(""); setFilters({ priority: "all", assignee: "all", dueDate: "all" }); }}
                      className="btn btn-secondary"
                    >
                      Aramayı Temizle
                    </button>
                  </div>
                ) : (
                  columns.map((col) => (
                    <Column
                      key={col.id}
                      column={col}
                      tasks={getTasksForColumn(col.id)}
                      onAddTask={addTask}
                      onTaskClick={setSelectedTask}
                      onDeleteColumn={deleteColumn}
                      onRenameColumn={renameColumn}
                      isTaskMatching={isFilterActive ? isTaskMatching : null}
                    />
                  ))
                )}
              </SortableContext>

              <button className="add-column-btn" onClick={() => setShowNewColumnModal(true)}>
                <Plus size={18} /> Sütun Ekle
              </button>
            </div>

            {/* DragOverlay */}
            <DragOverlay dropAnimation={{
              duration: 200,
              easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
            }}>
              {activeItem && activeType === "task" && (
                <div className="task-card task-card-overlay" style={{ backgroundColor: activeItem.color || "#fff", maxWidth: "280px" }}>
                  <div className="task-card-title">{activeItem.title}</div>
                  {activeItem.due_date && (
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      📅 {new Date(activeItem.due_date).toLocaleDateString("tr-TR")}
                    </div>
                  )}
                </div>
              )}
              {activeItem && activeType === "column" && (
                <div className="column column-dragging" style={{ opacity: 0.85, maxHeight: "400px" }}>
                  <div className="column-header">
                    <span>{activeItem.title}</span>
                  </div>
                  <div className="column-body" style={{ minHeight: "60px", background: "var(--bg-board)" }} />
                </div>
              )}
            </DragOverlay>


          </DndContext>
        )}

        {selectedTask && (
          <TaskModal
            task={selectedTask}
            boardId={boardId}
            boardTitle={board?.title}
            teamMembers={members}
            onClose={() => setSelectedTask(null)}
            onUpdate={(t) => setTasks(tasks.map((x) => (x.id === t.id ? t : x)))}
            onDelete={async (id) => {
              try {
                const { error } = await supabase.from("tasks").delete().eq("id", id);
                if (error) throw error;

                // Ana listeden güvenli (prev) state silimi
                setTasks(prev => prev.filter((x) => x.id !== id));

                // Sütunların içindeki listeden de sil
                setColumns(cols => cols.map(c => ({
                  ...c,
                  tasks: c.tasks ? c.tasks.filter(t => t.id !== id) : []
                })));

                setSelectedTask(null);
              } catch (err) {
                console.error("Görev silinirken hata oluştu:", err);
                window.alert("Görev silinemedi. Lütfen sayfayı yenileyip tekrar deneyin.");
              }
            }}
          />
        )}

        {/* Yeni Sütun Ekleme Modalı */}
        {showNewColumnModal && (
          <div className="modal-overlay" onClick={() => setShowNewColumnModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
              <div className="modal-header">
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Yeni Sütun Ekle</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowNewColumnModal(false)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">SÜTUN ADI</label>
                  <input
                    className="input"
                    placeholder="Örn: Yapılacaklar, Test Edilecekler..."
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addColumn()}
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginTop: "16px" }}>
                  <label className="form-label">SÜTUN RENGİ</label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
                    {COLUMN_COLORS.map(c => (
                      <div
                        key={c}
                        onClick={() => setNewColumnColor(c)}
                        style={{
                          width: "32px", height: "32px", borderRadius: "50%", background: c, cursor: "pointer",
                          border: newColumnColor === c ? "3px solid #1e293b" : "3px solid transparent",
                          transition: "all 0.2s"
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowNewColumnModal(false)}>İptal</button>
                <button className="btn btn-primary" onClick={addColumn} disabled={!newColumnTitle.trim()}>
                  <Plus size={16} /> Ekle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Board Özeti Modalı */}
        {showSummary && (
          <div className="modal-overlay" onClick={() => setShowSummary(false)} style={{ zIndex: 100 }}>
            <div
              onClick={e => e.stopPropagation()}
              className="modal-content summary-modal-premium"
              style={{
                background: "white",
                borderRadius: "20px",
                boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
                width: "92%",
                maxWidth: "680px",
                maxHeight: "85vh",
                overflowY: "auto",
                padding: "28px 32px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >

              {/* 1. HEADER */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
                <div>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "10px", fontFamily: "Georgia, serif" }}>
                    <BarChart3 size={22} color="#3b82f6" strokeWidth={2.5} /> Board Özeti
                  </h2>
                  <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px", fontFamily: "Georgia, serif" }}>Board — anlık durum analizi</p>
                </div>
                <button
                  onClick={() => setShowSummary(false)}
                  className="btn btn-ghost btn-icon"
                  style={{ borderRadius: "50%", padding: "6px" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* 2. STAT CARDS */}
              <div className="summary-grid-container">
                <div
                  onClick={() => { scrollToColumnByType('done'); setShowSummary(false); }}
                  className="summary-card"
                  style={{ background: "#f0fdf4", border: "1px solid #dcfce7", cursor: "pointer", display: "flex", flexDirection: "column", gap: "8px", transition: "all 0.15s ease" }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(22,163,74,0.15)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div className="summary-card-header">
                    <CheckCircle2 size={14} color="#16a34a" strokeWidth={2.5} />
                    <span style={{ fontSize: "0.6rem", fontWeight: 900, color: "#16a34a", letterSpacing: "0.12em", textTransform: "uppercase" }}>Tamamlanan</span>
                  </div>
                  <p style={{ fontSize: "2rem", lineHeight: 1, fontWeight: 700, color: "#15803d", fontFamily: "Georgia, serif", margin: "0" }}>{summaryStats.doneCount}</p>
                  <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#22c55e", margin: "0" }}>görev tamamlandı</p>
                </div>

                <div className="summary-card" style={{ background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div className="summary-card-header">
                    <ClipboardList size={14} color="#2563eb" strokeWidth={2.5} />
                    <span style={{ fontSize: "0.6rem", fontWeight: 900, color: "#2563eb", letterSpacing: "0.12em", textTransform: "uppercase" }}>Toplam</span>
                  </div>
                  <p style={{ fontSize: "2rem", lineHeight: 1, fontWeight: 700, color: "#1d4ed8", fontFamily: "Georgia, serif", margin: "0" }}>{summaryStats.totalCards}</p>
                  <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#3b82f6", margin: "0" }}>görev oluşturuldu</p>
                </div>

                <div
                  onClick={() => { scrollToColumnByType('inProgress'); setShowSummary(false); }}
                  className="summary-card"
                  style={{ background: "#fefce8", border: "1px solid #fef08a", cursor: "pointer", display: "flex", flexDirection: "column", gap: "8px", transition: "all 0.15s ease" }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(202,138,4,0.15)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div className="summary-card-header">
                    <PencilLine size={14} color="#ca8a04" strokeWidth={2.5} />
                    <span style={{ fontSize: "0.6rem", fontWeight: 900, color: "#ca8a04", letterSpacing: "0.12em", textTransform: "uppercase" }}>Devam Eden</span>
                  </div>
                  <p style={{ fontSize: "2rem", lineHeight: 1, fontWeight: 700, color: "#a16207", fontFamily: "Georgia, serif", margin: "0" }}>{summaryStats.inProgressCount}</p>
                  <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#eab308", margin: "0" }}>işlem yapılıyor</p>
                </div>

                <div
                  onClick={() => { scrollToColumnByType('upcoming'); setShowSummary(false); }}
                  className="summary-card"
                  style={{ background: "#fff1f2", border: "1px solid #ffe4e6", cursor: "pointer", display: "flex", flexDirection: "column", gap: "8px", transition: "all 0.15s ease" }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(225,29,72,0.15)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div className="summary-card-header">
                    <Clock size={14} color="#e11d48" strokeWidth={2.5} />
                    <span style={{ fontSize: "0.6rem", fontWeight: 900, color: "#e11d48", letterSpacing: "0.12em", textTransform: "uppercase" }}>Yaklaşan</span>
                  </div>
                  <p style={{ fontSize: "2rem", lineHeight: 1, fontWeight: 700, color: "#be123c", fontFamily: "Georgia, serif", margin: "0" }}>{summaryStats.upcomingCount}</p>
                  <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#f43f5e", margin: "0" }}>son teslim yaklaşıyor</p>
                </div>
              </div>

              {/* 3. DONUT CHART BÖLÜMÜ */}
              <div className="summary-chart-section">
                <div style={{ marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", marginBottom: "4px", fontFamily: "Georgia, serif" }}>Durum Genel Bakışı</h3>
                  <p style={{ fontSize: "0.8rem", color: "#94a3b8", fontFamily: "Georgia, serif" }}>Projenizin dağılımını görsel olarak analiz edin.</p>
                </div>

                <div className="chart-container-premium">
                  <div className="donut-chart-wrapper">
                    <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
                      {(() => {
                        const total = summaryStats.totalCards || 1;
                        let offset = 0;
                        const donePct = (summaryStats.doneCount / total) * 100;
                        const todoPct = (summaryStats.todoCount / total) * 100;
                        const progPct = (summaryStats.inProgressCount / total) * 100;
                        const otherPct = (summaryStats.otherCount / total) * 100;
                        const slices = [];

                        if (donePct > 0) {
                          slices.push(<circle key="done" cx="18" cy="18" r="15.915" fill="none" stroke="#16a34a" strokeWidth="3.8" strokeDasharray={`${donePct} ${100 - donePct}`} strokeDashoffset={-offset} strokeLinecap="round" />);
                          offset += donePct;
                        }
                        if (todoPct > 0) {
                          slices.push(<circle key="todo" cx="18" cy="18" r="15.915" fill="none" stroke="#a855f7" strokeWidth="3.8" strokeDasharray={`${todoPct} ${100 - todoPct}`} strokeDashoffset={-offset} strokeLinecap="round" />);
                          offset += todoPct;
                        }
                        if (progPct > 0) {
                          slices.push(<circle key="prog" cx="18" cy="18" r="15.915" fill="none" stroke="#ca8a04" strokeWidth="3.8" strokeDasharray={`${progPct} ${100 - progPct}`} strokeDashoffset={-offset} strokeLinecap="round" />);
                          offset += progPct;
                        }
                        if (otherPct > 0) {
                          slices.push(<circle key="other" cx="18" cy="18" r="15.915" fill="none" stroke="#94a3b8" strokeWidth="3.8" strokeDasharray={`${otherPct} ${100 - otherPct}`} strokeDashoffset={-offset} strokeLinecap="round" />);
                        }
                        return slices;
                      })()}
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "2.2rem", fontWeight: 700, color: "#1e293b", fontFamily: "Georgia, serif" }}>{summaryStats.totalCards}</span>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>Kart</span>
                    </div>
                  </div>

                  <div className="chart-legend-premium">
                    <div className="legend-item">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "14px", height: "14px", borderRadius: "4px", background: "#16a34a" }} />
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Tamamlanan</span>
                      </div>
                      <span style={{ fontSize: "1rem", fontWeight: 800, color: "#1e293b" }}>{summaryStats.doneCount}</span>
                    </div>
                    <div className="legend-item">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "14px", height: "14px", borderRadius: "4px", background: "#a855f7" }} />
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Yapılacak</span>
                      </div>
                      <span style={{ fontSize: "1rem", fontWeight: 800, color: "#1e293b" }}>{summaryStats.todoCount}</span>
                    </div>
                    <div className="legend-item">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "14px", height: "14px", borderRadius: "4px", background: "#ca8a04" }} />
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Devam Eden</span>
                      </div>
                      <span style={{ fontSize: "1rem", fontWeight: 800, color: "#1e293b" }}>{summaryStats.inProgressCount}</span>
                    </div>
                    {summaryStats.otherCount > 0 && (
                      <div className="legend-item">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "14px", height: "14px", borderRadius: "4px", background: "#94a3b8" }} />
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Diğer</span>
                        </div>
                        <span style={{ fontSize: "1rem", fontWeight: 800, color: "#1e293b" }}>{summaryStats.otherCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}