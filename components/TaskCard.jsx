"use client";

import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getDueDateStatus, getDueDateLabel, PRIORITIES } from "@/lib/utils";
import LabelBadge from "./LabelBadge";
import { Calendar, CheckSquare, GripVertical, Check } from "lucide-react";

export default function TaskCard({ task, onClick, dimmed, isCompleted }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const dueDateStatus = getDueDateStatus(task.due_date);
  const dueDateLabel = getDueDateLabel(task.due_date);

  const checklistTotal = task.checklists?.length || 0;
  const checklistDone = task.checklists?.filter((c) => c.is_completed).length || 0;
  const checklistPercent = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  // Öncelik stripe rengi
  const priority = PRIORITIES.find((p) => p.id === task.priority) || PRIORITIES[0];
  const showPriorityStripe = task.priority && task.priority !== "none";

  // Kart etiketleri (JSON string veya array olabilir)
  let taskLabels = [];
  if (task.labels) {
    try {
      taskLabels = typeof task.labels === "string" ? JSON.parse(task.labels) : task.labels;
    } catch {
      taskLabels = [];
    }
  }

  const hasColorStripe = task.color && task.color !== "#ffffff";

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        ...style,
        opacity: dimmed ? 0.2 : 1,
        transition: dimmed !== undefined ? "opacity 0.3s ease, " + (style.transition || "") : style.transition,
        cursor: "grab",
        padding: isMobile ? "14px" : "20px",
        minHeight: isMobile ? "100px" : "120px",
        gap: isMobile ? "8px" : "12px",
      }}
      className={`task-card ${isDragging ? "task-card-dragging" : ""}`}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onClick?.(task);
        }
      }}
    >
      {/* Öncelik Şeridi - Daha Belirgin */}
      {showPriorityStripe && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: "6px",
          background: priority.color,
          borderTopLeftRadius: "12px",
          borderBottomLeftRadius: "12px",
        }} />
      )}

      {/* Öncelik Bazlı Arka Plan Vurgusu (Opsiyonel/Hafif) */}
      {!isCompleted && showPriorityStripe && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: priority.color,
          opacity: 0.03,
          pointerEvents: "none",
          borderRadius: "12px"
        }} />
      )}

      {/* Sol renk şeridi (öncelik yoksa eski renk sistemi) */}
      {!showPriorityStripe && hasColorStripe && (
        <div style={{
          position: "absolute",
          left: 0,
          top: "8px",
          bottom: "8px",
          width: "4px",
          borderRadius: "0 4px 4px 0",
          background: task.color,
        }} />
      )}

      {/* Kart İçeriği */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Etiket rozetleri */}
          {taskLabels.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "6px" }}>
              {taskLabels.map((tag) => (
                <LabelBadge key={tag} labelText={tag} size="sm" />
              ))}
            </div>
          )}

          <div 
            className="task-card-title" 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "6px",
              textDecoration: isCompleted ? "line-through" : "none",
              opacity: isCompleted ? 0.7 : 1
            }}
          >
            {isCompleted && <Check size={14} strokeWidth={3} color="#22c55e" style={{ flexShrink: 0 }} />}
            {task.title}
          </div>

          {/* Checklist progress bar */}
          {checklistTotal > 0 && (
            <div style={{ marginTop: "6px" }}>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${checklistPercent}%` }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                <CheckSquare size={11} color="#94a3b8" />
                <span className="progress-text">{checklistDone}/{checklistTotal}</span>
              </div>
            </div>
          )}

          {/* Footer: due date badge + priority badge */}
          <div className="task-card-footer" style={{ marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              {dueDateStatus && (
                <span className={`badge badge-${dueDateStatus}`}>
                  <Calendar size={10} />
                  {dueDateLabel}
                </span>
              )}
              {showPriorityStripe && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    padding: "2px 8px",
                    borderRadius: "20px",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    background: `${priority.color}15`,
                    color: priority.color,
                  }}
                >
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: priority.color }} />
                  {priority.name}
                </span>
              )}
            </div>

            {/* Sorumlu Avatarı */}
            {task.assignee_profile && (
              <div
                title={task.assignee_profile.full_name || task.assignee_profile.email}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#eff6ff",
                  border: "2px solid white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "#3b82f6",
                  overflow: "hidden",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  flexShrink: 0
                }}
              >
                {task.assignee_profile.avatar_url ? (
                  <img
                    src={task.assignee_profile.avatar_url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  (task.assignee_profile.full_name?.[0] || task.assignee_profile.email?.[0] || "?").toUpperCase()
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
