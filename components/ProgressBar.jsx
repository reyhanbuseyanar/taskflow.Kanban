"use client";

import { CheckCircle2, TrendingUp } from "lucide-react";

export default function ProgressBar({ columns, tasks }) {
  // "Tamamlandı", "Done", "Bitti" sütunlarındaki kartları say
  const doneColumnIds = columns
    .filter((col) => {
      const t = col.title.toLowerCase();
      return t.includes("tamamlandı") || t.includes("done") || t.includes("bitti") || t.includes("tamamlanan");
    })
    .map((col) => col.id);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => doneColumnIds.includes(t.column_id)).length;
  const percent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  if (totalTasks === 0) return null;

  // Gradient rengini yüzdeye göre belirle
  const getGradient = () => {
    if (percent >= 80) return "linear-gradient(90deg, #22c55e, #10b981)";
    if (percent >= 50) return "linear-gradient(90deg, #6366f1, #818cf8)";
    if (percent >= 25) return "linear-gradient(90deg, #f59e0b, #fbbf24)";
    return "linear-gradient(90deg, #94a3b8, #cbd5e1)";
  };

  return (
    <div
      className="board-progress"
      style={{
        padding: "12px 32px",
        background: "white",
        borderBottom: "1px solid #f1f5f9",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      {/* İkon */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          background: percent === 100 ? "#dcfce7" : "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {percent === 100 ? (
          <CheckCircle2 size={16} color="#22c55e" />
        ) : (
          <TrendingUp size={16} color="#6366f1" />
        )}
      </div>

      {/* Bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            height: "8px",
            background: "#f1f5f9",
            borderRadius: "10px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${percent}%`,
              background: getGradient(),
              borderRadius: "10px",
              transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
            }}
          >
            {/* Parıltı efekti */}
            {percent > 0 && percent < 100 && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: "20px",
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4))",
                  borderRadius: "0 10px 10px 0",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Metin */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "0.8rem",
            fontWeight: 700,
            color: percent === 100 ? "#22c55e" : "#0f172a",
          }}
        >
          %{percent}
        </span>
        <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
          {doneTasks}/{totalTasks} görev
        </span>
        {percent === 100 && (
          <span style={{ fontSize: "0.75rem" }}>🎉</span>
        )}
      </div>
    </div>
  );
}
