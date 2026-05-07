"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Check } from "lucide-react";
import TaskModal from "@/components/TaskModal";

const TYPE_COLORS = {
  project: { main: "#6366f1", light: "#eef2ff" },
  meeting: { main: "#22c55e", light: "#f0fdf4" },
  daily: { main: "#f59e0b", light: "#fffbeb" },
  default: { main: "#94a3b8", light: "#f8fafc" }
};

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/login");
        return;
      }
      setUser(session.user);
      await fetchCalendarData(session.user.id);
    };
    init();

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [router]);

  const fetchCalendarData = async (userId) => {
    try {
      // 1. Panoları, sütunları ve görevleri tek seferde çek (Nested Select)
      const { data: boards, error: boardsError } = await supabase
        .from("boards")
        .select(`
          id, 
          title,
          type,
          columns (
            id, 
            title, 
            tasks (*)
          )
        `)
        .eq("user_id", userId);

      if (boardsError) throw boardsError;

      // 2. Tüm sütunları ve görevleri düzleştirilmiş listelere ayır
      const allColumns = boards.flatMap(b => b.columns || []);
      const allTasksRaw = allColumns.flatMap(c => c.tasks || []).filter(t => t.due_date);

      // Sütun başlıklarına göre tamamlanmış görevleri işaretle
      const doneKeywords = ["tamamlandı", "done", "bitti", "tamamlanan"];
      const formattedTasks = allTasksRaw.map(task => {
        const column = allColumns.find(c => c.id === task.column_id);
        const board = boards.find(b => b.columns.some(c => c.id === task.column_id));
        const boardType = board?.type || "project";
        const colors = TYPE_COLORS[boardType] || TYPE_COLORS.default;
        
        const columnTitle = column?.title.toLowerCase() || "";
        const isCompleted = doneKeywords.some(keyword => columnTitle.includes(keyword));
        return { ...task, isCompleted, colors, board_title: board?.title };
      });

      setTasks(formattedTasks);

      // 3. Ekip üyelerini çek (Paralel olarak board_members ve profiles)
      const boardIds = boards.map(b => b.id);
      if (boardIds.length > 0) {
        const [ { data: memberData }, { data: assigneeProfiles } ] = await Promise.all([
          supabase.from("board_members").select("user_id").in("board_id", boardIds),
          allTasksRaw.length > 0 
            ? supabase.from("profiles").select("*").in("id", [...new Set(allTasksRaw.map(t => t.assignee_id).filter(id => id))])
            : Promise.resolve({ data: [] })
        ]);

        const memberIds = memberData?.map(m => m.user_id) || [];
        const uniqueUserIds = [...new Set([...memberIds])];
        
        if (uniqueUserIds.length > 0) {
          const { data: memberProfiles } = await supabase.from("profiles").select("*").in("id", uniqueUserIds);
          // Tüm profilleri birleştir (assignee + members)
          const allProfiles = [...(memberProfiles || []), ...(assigneeProfiles || [])];
          const uniqueProfiles = Array.from(new Map(allProfiles.map(p => [p.id, p])).values());
          setTeamMembers(uniqueProfiles);
        } else if (assigneeProfiles?.length > 0) {
          setTeamMembers(assigneeProfiles);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("Fetch calendar data error:", err);
      setLoading(false);
    }
  };

  // Takvim hesaplamaları
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayOfMonth = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const days = [];
  // Boş günler (önceki aydan kalan)
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // Ayın günleri
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  if (loading) {
    return <div className="auth-container">Yükleniyor...</div>;
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content">
        <div style={{ 
          padding: isMobile ? "12px" : "40px", 
          maxWidth: "1200px", 
          margin: "0 auto" 
        }}>
          <header style={{ 
            marginBottom: "24px", 
            display: "flex", 
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between", 
            alignItems: isMobile ? "flex-start" : "center",
            gap: "16px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "var(--accent)", color: "white", padding: "10px", borderRadius: "12px" }}>
                <CalendarIcon size={24} />
              </div>
              <h1 style={{ fontSize: isMobile ? "1.4rem" : "1.75rem", fontWeight: 800 }}>Etkinlik Takvimi</h1>
            </div>

            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "16px", 
              background: "white", 
              padding: "6px 12px", 
              borderRadius: "12px", 
              border: "1px solid var(--border-color)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
            }}>
              <button className="btn btn-ghost btn-icon" onClick={prevMonth}><ChevronLeft size={20} /></button>
              <span style={{ fontWeight: 700, minWidth: "110px", textAlign: "center", fontSize: "0.9rem" }}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <button className="btn btn-ghost btn-icon" onClick={nextMonth}><ChevronRight size={20} /></button>
            </div>
          </header>

          <div className="calendar-container" style={{ overflowX: "hidden", borderRadius: "12px", border: "1px solid var(--border-color)", background: "white", padding: isMobile ? "8px" : "24px" }}>
            <div className="calendar-grid" style={{ minWidth: "100%", background: "transparent", gap: "0" }}>
              {["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"].map(day => (
                <div key={day} className="calendar-day-header" style={{ padding: isMobile ? "8px 4px" : "12px", fontSize: isMobile ? "0.6rem" : "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{day}</div>
              ))}

              {days.map((day, index) => {
                const dateStr = day ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
                const dayTasks = tasks.filter(t => t.due_date && t.due_date.startsWith(dateStr));

                const today = new Date();
                const isToday = day &&
                  day === today.getDate() &&
                  currentDate.getMonth() === today.getMonth() &&
                  currentDate.getFullYear() === today.getFullYear();

                return (
                  <div
                    key={index}
                    className="calendar-day"
                    style={{
                      border: "1px solid var(--border-color)",
                      opacity: day ? 1 : 0.4,
                      background: isToday ? "#f5f3ff" : "var(--bg-secondary)",
                      position: "relative"
                    }}
                  >
                    {isToday && (
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#8b5cf6" }} />
                    )}
                    <div className="calendar-day-number" style={{ 
                      color: isToday ? "#6d28d9" : "inherit", 
                      fontWeight: isToday ? 800 : 600,
                      fontSize: isMobile ? "0.7rem" : "0.9rem",
                      padding: isMobile ? "4px" : "8px"
                    }}>{day}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {dayTasks.map(task => {
                          const assignee = teamMembers.find(m => m.id === task.assignee_id);
                          
                          return (
                            <div
                              key={task.id}
                              className={`calendar-task-item ${task.isCompleted ? "completed" : ""}`}
                              title={`${task.title}${assignee ? ` - Sorumlu: ${assignee.full_name || assignee.email}` : ""}`}
                              onClick={() => setSelectedTask(task)}
                              style={{ 
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                opacity: task.isCompleted ? 0.6 : 1,
                                textDecoration: task.isCompleted ? "line-through" : "none",
                                paddingRight: "4px",
                                background: task.isCompleted ? "var(--bg-primary)" : task.colors.light,
                                color: task.isCompleted ? "var(--text-muted)" : task.colors.main,
                                borderLeft: `3px solid ${task.isCompleted ? "#cbd5e1" : task.colors.main}`,
                                marginBottom: "2px"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "2px", flex: 1, minWidth: 0 }}>
                                {task.isCompleted && <Check size={10} strokeWidth={3} color="#22c55e" style={{ flexShrink: 0 }} />}
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: isMobile ? "0.55rem" : "0.75rem" }}>
                                  {task.title}
                                </span>
                              </div>

                              {assignee && (
                                <div 
                                  style={{
                                    width: "18px",
                                    height: "18px",
                                    borderRadius: "50%",
                                    background: "var(--accent-light)",
                                    color: "var(--accent)",
                                    fontSize: "0.6rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    flexShrink: 0,
                                    border: "1px solid white",
                                    overflow: "hidden"
                                  }}
                                >
                                  {assignee.avatar_url ? (
                                    <img src={assignee.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  ) : (
                                    (assignee.full_name?.[0] || assignee.email?.[0] || "?").toUpperCase()
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          boardTitle={selectedTask.board_title}
          teamMembers={teamMembers}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updatedTask) => {
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
            setSelectedTask(null);
          }}
          onDelete={async (id) => {
            try {
              const { error } = await supabase.from("tasks").delete().eq("id", id);
              if (error) throw error;
              
              setTasks(prev => prev.filter(t => t.id !== id));
              setSelectedTask(null);
            } catch (err) {
              console.error("Takvimde görev silinirken hata oluştu:", err);
              window.alert("Görev silinemedi. İnternet bağlantınızı kontrol edip sayfayı yenileyin.");
            }
          }}
        />
      )}
    </div>
  );
}
