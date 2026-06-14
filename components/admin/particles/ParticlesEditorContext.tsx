"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface ParticlesEditorContextValue {
  activeIconNames: string[];
  setActiveIconNames: (names: string[]) => void;
  desktopCount: number;
  mobileCount: number;
  setDesktopCount: (value: number) => void;
  setMobileCount: (value: number) => void;
  saveStatus: SaveStatus;
  setSaveStatus: (status: SaveStatus) => void;
}

const ParticlesEditorContext = createContext<ParticlesEditorContextValue | null>(
  null,
);

function iconNamesEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((name, index) => name === b[index]);
}

export function ParticlesEditorProvider({ children }: { children: ReactNode }) {
  const [activeIconNames, setActiveIconNamesState] = useState<string[]>([]);
  const setActiveIconNames = useCallback((names: string[]) => {
    setActiveIconNamesState((prev) =>
      iconNamesEqual(prev, names) ? prev : names,
    );
  }, []);
  const [desktopCount, setDesktopCount] = useState(20);
  const [mobileCount, setMobileCount] = useState(12);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const value = useMemo(
    () => ({
      activeIconNames,
      setActiveIconNames,
      desktopCount,
      mobileCount,
      setDesktopCount,
      setMobileCount,
      saveStatus,
      setSaveStatus,
    }),
    [
      activeIconNames,
      setActiveIconNames,
      desktopCount,
      mobileCount,
      saveStatus,
    ],
  );

  return (
    <ParticlesEditorContext.Provider value={value}>
      {children}
    </ParticlesEditorContext.Provider>
  );
}

export function useParticlesEditor() {
  const ctx = useContext(ParticlesEditorContext);
  if (!ctx) {
    throw new Error("useParticlesEditor debe usarse dentro de ParticlesEditorProvider");
  }
  return ctx;
}
