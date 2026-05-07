"use client";

import { useState } from "react";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "./TaskCard";
import { Plus, MoreHorizontal, Trash2, Pencil } from "lucide-react";

export default function Column({
  column,
  tasks,
  onAddTask,
  onTaskClick,
  onDeleteColumn,
  onRenameColumn,
  isTaskMatching,
}) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);

  // Sütunun kendisini sürüklenebilir yapıyoruz
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column", column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Sütun içine kart bırakılabilmesi için droppable alanı
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `column-droppable-${column.id}`,
    data: { type: "column", columnId: column.id },
  });

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask(column.id, newTaskTitle.trim());
    setNewTaskTitle("");
    // setShowAddTask(false); // Kaldırıldı: Kullanıcı seri şekilde Enter'a basarak birden fazla kart ekleyebilir
  };

  const handleRename = () => {
    if (editTitle.trim() && editTitle.trim() !== column.title) {
      onRenameColumn(column.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const taskIds = tasks.map((t) => t.id);

  const getColumnAccent = () => {
    const title = column.title.toLowerCase();
    if (title.includes("yapılacak") || title.includes("todo") || title.includes("backlog") || title.includes("bugün")) return "#6366f1";
    if (title.includes("devam") || title.includes("progress") || title.includes("yapılıyor") || title.includes("hazırlık") || title.includes("notlar")) return "#f59e0b";
    if (title.includes("tamamlandı") || title.includes("done") || title.includes("bitti") || title.includes("tamamlanan")) return "#22c55e";
    if (title.includes("test") || title.includes("review") || title.includes("planlanan")) return "#8b5cf6";
    return null;
  };

  const accentColor = (column.color && column.color !== "#94a3b8") 
    ? column.color 
    : (getColumnAccent() || "#94a3b8");

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={`column ${isDragging ? "column-dragging" : ""}`}
      data-column-id={column.id}
    >
      {/* Renkli Üst Şerit */}
      <div style={{ height: "4px", background: accentColor, borderRadius: "16px 16px 0 0" }} />

      {/* Sütun Başlık Çubuğu */}
      <div className="column-header">
        <div className="column-header-left" {...attributes} {...listeners} style={{ cursor: "grab" }}>

          {/* Renk noktası */}
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: accentColor, flexShrink: 0, boxShadow: `0 0 0 3px ${accentColor}20` }} />

          {isEditing ? (
            <input
              className="input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
              style={{ padding: "4px 8px", fontSize: "0.85rem", width: 140 }}
            />
          ) : (
            <span
              onDoubleClick={() => setIsEditing(true)}
              style={{ fontWeight: 600, fontSize: "0.88rem" }}
            >
              {column.title}
            </span>
          )}
          <span className="column-count">{tasks.length}</span>
        </div>

        <div style={{ position: "relative" }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setShowMenu(!showMenu)}
            style={{ width: 28, height: 28 }}
          >
            <MoreHorizontal size={16} />
          </button>

          {showMenu && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "100%",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "var(--shadow-lg)",
                zIndex: 50,
                minWidth: 160,
                padding: 4,
              }}
            >
              <button
                className="btn btn-ghost"
                style={{ width: "100%", justifyContent: "flex-start", fontSize: "0.82rem" }}
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
              >
                <Pencil size={14} /> Yeniden Adlandır
              </button>
              <button
                className="btn btn-ghost"
                style={{
                  width: "100%",
                  justifyContent: "flex-start",
                  fontSize: "0.82rem",
                  color: "var(--danger)",
                }}
                onClick={() => {
                  onDeleteColumn(column.id);
                  setShowMenu(false);
                }}
              >
                <Trash2 size={14} /> Sütunu Sil
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Kart Listesi (Droppable Alan) */}
      <div
        className="column-body"
        ref={setDroppableRef}
        style={{
          // Boş sütuna kart bırakabilmek için minimum yükseklik
          minHeight: tasks.length === 0 ? "120px" : "60px",
          // İsOver: Kart sütunun üzerindeyken görsel ipucu
          background: isOver ? "rgba(99, 102, 241, 0.06)" : "transparent",
          borderRadius: "var(--radius-sm)",
          transition: "background 0.2s ease",
          // Boş sütunsa ortaya "buraya bırak" hissi
          ...(isOver && tasks.length === 0 ? {
            border: "2px dashed var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          } : {}),
        }}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => {
            const isCompletedColumn = ["tamamlandı", "done", "bitti", "tamamlanan"].some(kw => 
              column.title.toLowerCase().includes(kw)
            );
            
            return (
              <TaskCard
                key={task.id}
                task={task}
                onClick={onTaskClick}
                dimmed={isTaskMatching ? !isTaskMatching(task) : false}
                isCompleted={isCompletedColumn}
              />
            );
          })}
        </SortableContext>

        {/* Boş sütun placeholder */}
        {tasks.length === 0 && !showAddTask && !isOver && (
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "0.8rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={18} color="var(--text-muted)" />
            </div>
            Kartı buraya sürükle veya aşağıdan ekle
          </div>
        )}

        {/* Kart sürüklenirken boş sütunda gösterilen hedef */}
        {isOver && tasks.length === 0 && (
          <div style={{
            padding: "12px",
            border: "2px dashed var(--accent)",
            borderRadius: "var(--radius-sm)",
            background: "var(--accent-light)",
            textAlign: "center",
            color: "var(--accent)",
            fontSize: "0.8rem",
            fontWeight: 600,
          }}>
            Buraya bırak
          </div>
        )}
      </div>

      {/* Yeni Kart Ekleme */}
      <div className="column-footer">
        {showAddTask ? (
          <div>
            <input
              className="input"
              placeholder="Kart başlığı girin..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTask();
                if (e.key === "Escape") { setShowAddTask(false); setNewTaskTitle(""); }
              }}
              autoFocus
              style={{ marginBottom: 8, fontSize: "0.85rem" }}
            />
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-primary" onClick={handleAddTask} style={{ flex: 1, padding: "8px 12px", fontSize: "0.82rem" }}>
                <Plus size={14} /> Kart Ekle
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => { setShowAddTask(false); setNewTaskTitle(""); }}
                style={{ padding: "8px 12px", fontSize: "0.82rem" }}
              >
                İptal
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-ghost"
            onClick={() => setShowAddTask(true)}
            style={{ width: "100%", justifyContent: "flex-start", fontSize: "0.82rem", color: "var(--text-muted)" }}
          >
            <Plus size={16} /> Kart Ekle
          </button>
        )}
      </div>
    </div>
  );
}
