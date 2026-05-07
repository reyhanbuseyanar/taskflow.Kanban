"use client";

import { useState } from "react";
import { Filter, ChevronDown, X } from "lucide-react";
import { PRIORITIES } from "@/lib/utils";
import { getLabelColor, getLabelName } from "./LabelBadge";

export default function FilterPanel({ filters, onFiltersChange, tasks = [], members = [] }) {
  const [showPanel, setShowPanel] = useState(false);

  const activeCount =
    (filters.priority !== "all" ? 1 : 0) +
    (filters.assignee !== "all" ? 1 : 0) +
    (filters.dueDate !== "all" ? 1 : 0);

  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAll = () => {
    onFiltersChange({ priority: "all", assignee: "all", dueDate: "all" });
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 14px",
          borderRadius: "10px",
          border: activeCount > 0 ? "1.5px solid #6366f1" : "1.5px solid #e2e8f0",
          background: activeCount > 0 ? "#eef2ff" : "#f8fafc",
          color: activeCount > 0 ? "#6366f1" : "#64748b",
          cursor: "pointer",
          fontSize: "0.82rem",
          fontWeight: 600,
          transition: "all 0.15s ease",
        }}
      >
        <Filter size={14} />
        Filtrele
        {activeCount > 0 && (
          <span
            style={{
              background: "#6366f1",
              color: "white",
              fontSize: "0.65rem",
              fontWeight: 700,
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {activeCount}
          </span>
        )}
        <ChevronDown size={14} style={{ transform: showPanel ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {showPanel && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05)",
            padding: "16px",
            zIndex: 200,
            width: "calc(100vw - 40px)", // Mobilde ekranın çoğunu kaplasın
            maxWidth: "300px", // Masaüstünde orijinal boyutu korusun
            animation: "slideUp 0.15s ease",
          }}
        >
          {/* Başlık */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a" }}>Filtreler</span>
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <X size={12} /> Temizle
              </button>
            )}
          </div>

          {/* Öncelik Filtresi */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", display: "block" }}>
              Öncelik
            </label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <FilterChip
                label="Hepsi"
                active={filters.priority === "all"}
                onClick={() => updateFilter("priority", "all")}
                color="#64748b"
              />
              {PRIORITIES.filter(p => p.id !== "none").map((p) => (
                <FilterChip
                  key={p.id}
                  label={p.name}
                  active={filters.priority === p.id}
                  onClick={() => updateFilter("priority", p.id)}
                  color={p.color}
                />
              ))}
            </div>
          </div>

          {/* Sorumlu Filtresi */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", display: "block" }}>
              Sorumlu Kişi
            </label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <FilterChip
                label="Hepsi"
                active={filters.assignee === "all"}
                onClick={() => updateFilter("assignee", "all")}
                color="#64748b"
              />
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => updateFilter("assignee", member.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 12px",
                    borderRadius: "20px",
                    border: `1.5px solid ${filters.assignee === member.id ? "#3b82f6" : "#e2e8f0"}`,
                    background: filters.assignee === member.id ? "#eff6ff" : "white",
                    color: filters.assignee === member.id ? "#3b82f6" : "#475569",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#dbeafe", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem" }}>
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      (member.full_name?.[0] || member.email?.[0] || "?").toUpperCase()
                    )}
                  </div>
                  {member.full_name || member.email.split("@")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Tarih Filtresi */}
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", display: "block" }}>
              Bitiş Tarihi
            </label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <FilterChip label="Hepsi" active={filters.dueDate === "all"} onClick={() => updateFilter("dueDate", "all")} color="#64748b" />
              <FilterChip label="Gecikmiş" active={filters.dueDate === "overdue"} onClick={() => updateFilter("dueDate", "overdue")} color="#ef4444" />
              <FilterChip label="Bugün" active={filters.dueDate === "today"} onClick={() => updateFilter("dueDate", "today")} color="#f59e0b" />
              <FilterChip label="Bu Hafta" active={filters.dueDate === "week"} onClick={() => updateFilter("dueDate", "week")} color="#3b82f6" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick, color, dot }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        padding: "5px 12px",
        borderRadius: "20px",
        border: `1.5px solid ${active ? color : "#e2e8f0"}`,
        background: active ? `${color}12` : "white",
        color: active ? color : "#475569",
        fontSize: "0.75rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {dot && (
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: color }} />
      )}
      {label}
    </button>
  );
}
