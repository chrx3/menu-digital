"use client";

import { useEffect } from "react";

/**
 * Warns the user before leaving the page (reload/close) when there are
 * unsaved changes. Also exposes a helper to confirm in-app navigation.
 */
export function useDirtyGuard(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
}

/**
 * Confirms navigation when there are unsaved changes. Returns true when it is
 * safe to proceed (no changes or user accepted losing them).
 */
export function confirmDiscardChanges(isDirty: boolean): boolean {
  if (!isDirty) return true;
  return window.confirm(
    "Tienes cambios sin guardar. \u00bfSeguro que quieres salir y descartarlos?",
  );
}

/**
 * In-app navigation guard for client-side links. Wrap an onClick handler so
 * that route changes (e.g. Sidebar links, admin tabs) prompt before losing
 * unsaved edits.
 */
export function guardNavigation(
  isDirty: boolean,
  next: () => void,
): () => void {
  return () => {
    if (confirmDiscardChanges(isDirty)) next();
  };
}
