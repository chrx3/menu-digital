"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  EditorProvider,
  useEditor,
  type EditorState,
} from "./EditorContext";
import { DevicePreview } from "./DevicePreview";
import { EditableLanding } from "./EditableLanding";
import { EditPanel } from "./EditPanel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useDirtyGuard } from "@/app/hooks/useDirtyGuard";
import {
  Loader2,
  Smartphone,
  Monitor,
  Save,
  Undo2,
  ChevronRight,
  PanelRightOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

function EditorToolbar() {
  const {
    isDirty,
    selectElement,
    deviceMode,
    setDeviceMode,
    state,
    canUndo,
    undo,
    markSaved,
  } = useEditor();
  const [saving, startSaving] = useTransition();
  const [mounted, setMounted] = useState(false);

  useDirtyGuard(isDirty);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  function handleSave() {
    startSaving(async () => {
      const result = await import("@/app/actions/editor").then((m) =>
        m.saveEditorState(state),
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        markSaved();
        toast.success("Todos los cambios guardados");
      }
    });
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        selectElement(null);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty && !saving) handleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isDirty, saving, selectElement, canUndo, undo]);

  // During SSR and initial hydration, render the button as disabled.
  // After mount, use the real dirty state to avoid hydration mismatch
  // caused by @base-ui/react Button SSR behavior with the disabled prop.
  const saveDisabled = mounted ? !isDirty || saving : true;

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">Editor Visual</span>
        {mounted && isDirty && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 px-1.5 py-0.5 rounded">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Sin guardar
          </span>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="flex rounded-lg border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setDeviceMode("desktop")}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              deviceMode === "desktop"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode("mobile")}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              deviceMode === "mobile"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Móvil
          </button>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <Button
          size="sm"
          variant="outline"
          onClick={undo}
          disabled={!mounted || !canUndo}
          aria-label="Deshacer último cambio"
        >
          <Undo2 className="mr-1.5 h-3.5 w-3.5" />
          Deshacer
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saveDisabled}>
          {mounted && saving ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-3.5 w-3.5" />
          )}
          Guardar
        </Button>
      </div>
    </header>
  );
}

function EditorContent() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const { deviceMode, state } = useEditor();
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state to iframe when it's ready and state changes
  useEffect(() => {
    if (!iframeReady) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "editor:sync", payload: state },
        window.location.origin,
      );
    }, 300);
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [state, iframeReady]);

  // Listen for iframe ready signal
  useEffect(() => {
    function handle(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "editor:ready") {
        setIframeReady(true);
        // Send initial state immediately
        iframeRef.current?.contentWindow?.postMessage(
          { type: "editor:sync", payload: state },
          window.location.origin,
        );
      }
    }
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [state]);

  const previewUrl = `/admin/editor-preview`;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* Preview area */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <DevicePreview>
          {deviceMode === "desktop" ? (
            <EditableLanding />
          ) : (
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="h-full w-full border-0"
              title="Vista previa móvil"
            />
          )}
        </DevicePreview>

        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => setPanelOpen((open) => !open)}
          className="absolute top-3 right-3 z-50 shadow-md"
          aria-label={
            panelOpen ? "Ocultar panel de edición" : "Abrir panel de edición"
          }
          aria-expanded={panelOpen}
        >
          {panelOpen ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <PanelRightOpen className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Edit panel — wider with internal scroll */}
      <div
        className={cn(
          "flex shrink-0 min-h-0 flex-col border-l bg-background transition-[width] duration-300 ease-in-out",
          panelOpen
            ? "w-[min(420px,38vw)]"
            : "w-0 overflow-hidden border-l-0",
        )}
      >
        {panelOpen && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <EditPanel />
          </div>
        )}
      </div>
    </div>
  );
}

interface TemplateEditorProps {
  initialState: EditorState;
}

export function TemplateEditor({ initialState }: TemplateEditorProps) {
  return (
    <EditorProvider initialState={initialState}>
      <div className="flex h-full min-h-0 flex-col">
        <EditorToolbar />
        <EditorContent />
      </div>
    </EditorProvider>
  );
}
