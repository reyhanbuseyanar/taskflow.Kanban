"use client";

import { useState } from "react";
import { X } from "lucide-react";



// Girdi metnine göre her zaman aynı pastel rengi üretir
export function getLabelColor(text) {
  if (!text) return "#94a3b8";
  if (PREDEFINED_COLORS[text.toLowerCase()]) {
    return PREDEFINED_COLORS[text.toLowerCase()].color;
  }

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

export function getLabelName(text) {
  if (!text) return "";
  if (PREDEFINED_COLORS[text.toLowerCase()]) {
    return PREDEFINED_COLORS[text.toLowerCase()].name;
  }
  return text;
}

export default function LabelBadge({ labelText, size = "sm" }) {
  if (!labelText) return null;

  const isSmall = size === "sm";
  const color = getLabelColor(labelText);
  const name = getLabelName(labelText);

  return (
    <span
      className="label-badge"
      style={{
        background: `${color}18`,
        color: color,
        fontSize: isSmall ? "0.65rem" : "0.75rem",
        padding: isSmall ? "2px 8px" : "3px 10px",
        borderRadius: "20px",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        border: `1px solid ${color}30`,
        lineHeight: 1.4,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: isSmall ? "6px" : "7px",
          height: isSmall ? "6px" : "7px",
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      {name}
    </span>
  );
}

// Kullanıcının serbest metin girebileceği Tag Input
export function TagInput({ selectedLabels = [], onChange }) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (!selectedLabels.includes(newTag)) {
        onChange([...selectedLabels, newTag]);
      }
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(selectedLabels.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {selectedLabels.map((tag) => {
          const color = getLabelColor(tag);
          const name = getLabelName(tag);
          return (
            <span
              key={tag}
              style={{
                background: `${color}15`,
                color: color,
                border: `1px solid ${color}40`,
                borderRadius: "20px",
                padding: "4px 10px",
                fontSize: "0.8rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: color }} />
              {name}
              <button
                onClick={(e) => { e.preventDefault(); removeTag(tag); }}
                style={{
                  background: "none",
                  border: "none",
                  color: color,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                  marginLeft: "2px",
                }}
              >
                <X size={13} />
              </button>
            </span>
          );
        })}
      </div>
      <input
        type="text"
        placeholder="Örn: Proje X, Toplantı... (Yazıp Enter'a basın)"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="input"
        style={{ fontSize: "0.85rem", padding: "8px 12px" }}
      />
    </div>
  );
}
