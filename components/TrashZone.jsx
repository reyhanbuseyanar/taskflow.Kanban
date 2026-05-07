"use client";

import { useDroppable } from "@dnd-kit/core";
import { Trash2 } from "lucide-react";

export default function TrashZone({ isOver, show }) {
  const { setNodeRef } = useDroppable({ id: "trash-zone" });

  return (
    <div 
      ref={setNodeRef} 
      className={`trash-zone ${show ? "trash-zone-visible" : ""} ${isOver ? "trash-zone-active" : ""}`}
    >
      <Trash2 size={24} />
    </div>
  );
}
