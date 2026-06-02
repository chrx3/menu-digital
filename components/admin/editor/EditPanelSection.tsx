"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditPanelSectionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function EditPanelSection({
  title,
  description,
  defaultOpen = true,
  children,
}: EditPanelSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-lg border bg-muted/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
        aria-expanded={open}
      >
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            !open && "-rotate-90",
          )}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">{title}</p>
          {description && (
            <p className="text-[10px] text-muted-foreground leading-snug">
              {description}
            </p>
          )}
        </div>
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-t px-3 py-3">{children}</div>
      )}
    </section>
  );
}
