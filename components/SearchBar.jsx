"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

export default function SearchBar({ value, onChange }) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  // Ctrl+K / Cmd+K kısayolu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      className="search-bar"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        background: focused ? "#ffffff" : "#f1f5f9",
        border: `1.5px solid ${focused ? "#6366f1" : "#e2e8f0"}`,
        borderRadius: "10px",
        padding: "0 12px",
        transition: "all 0.2s ease",
        boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
        minWidth: "320px",
      }}
    >
      <Search size={15} color={focused ? "#6366f1" : "#94a3b8"} style={{ flexShrink: 0 }} />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          padding: "9px 10px",
          fontSize: "0.82rem",
          color: "#0f172a",
          width: "100%",
          fontFamily: "inherit",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            color: "#94a3b8",
            borderRadius: "4px",
            transition: "color 0.15s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = "#ef4444")}
          onMouseOut={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
