"use client";

import { cn } from "@/lib/utils";
import { type ReactNode } from "react";
import type { SelectedElement, SelectedElementType } from "./EditorContext";

interface EditableWrapperProps {
  type: SelectedElementType;
  slug?: string;
  label: string;
  children: ReactNode;
  onSelect: (el: SelectedElement) => void;
  selected: SelectedElement | null;
  className?: string;
}

export function EditableWrapper({
  type,
  slug,
  label,
  children,
  onSelect,
  selected,
  className,
}: EditableWrapperProps) {
  const isSelected =
    selected?.type === type && selected?.slug === slug;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect({ type, slug });
      }}
      className={cn(
        "relative cursor-pointer transition-all",
        "hover:ring-2 hover:ring-primary/40 hover:bg-primary/[0.02]",
        isSelected && "ring-2 ring-primary bg-primary/5 z-10",
        className,
      )}
    >
      {/* Label badge — visible on hover or when selected */}
      <span
        className={cn(
          "absolute -top-2.5 left-2 z-20 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all",
          "bg-primary text-primary-foreground",
          isSelected
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 hover:opacity-100",
        )}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
