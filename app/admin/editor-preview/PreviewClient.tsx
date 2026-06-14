"use client";

import { useEffect, useState, useCallback } from "react";
import MenuLandingClient from "@/app/components/MenuLandingClient";
import type { BusinessConfig, BusinessTheme, ParticleIcon } from "@/app/config/types";
import type { Categoria } from "@/app/types";

interface PreviewInitialState {
  business: BusinessConfig | null;
  theme: BusinessTheme | null;
  translations: Record<string, string>;
  particleIcons: ParticleIcon[];
  hiddenBuiltins: string[];
  menu: Categoria[];
}

export function PreviewClient({ initialState }: { initialState: PreviewInitialState }) {
  const [state, setState] = useState(initialState);

  // Listen for state updates from parent editor window
  const handleMessage = useCallback((e: MessageEvent) => {
    if (e.origin !== window.location.origin) return;
    if (e.data?.type === "editor:sync") {
      setState(e.data.payload);
    }
    // Theme-only updates (used by the standalone Theme editor preview).
    if (e.data?.type === "theme:sync") {
      setState((prev) => ({
        ...prev,
        theme: prev.theme
          ? { ...prev.theme, ...e.data.payload }
          : e.data.payload,
      }));
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    // Signal that preview is ready to receive updates
    window.parent.postMessage({ type: "editor:ready" }, window.location.origin);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  if (!state.business) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#fff8f0] text-[#3D1F00]">
        <p>No se pudo cargar la vista previa</p>
      </div>
    );
  }

  return (
    <MenuLandingClient
      config={{
        business: state.business,
        theme: state.theme,
        translations: state.translations,
        particleIcons: state.particleIcons,
      }}
      menu={state.menu}
    />
  );
}
