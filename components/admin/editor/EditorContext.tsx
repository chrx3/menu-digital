"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import type {
  BusinessConfig,
  BusinessTheme,
  ParticleIcon,
} from "@/app/config/types";
import type { Categoria, Producto } from "@/app/types";

export type SelectedElementType =
  | "navbar"
  | "search"
  | "particles"
  | "category"
  | "product"
  | "footer"
  | "theme";

export interface SelectedElement {
  type: SelectedElementType;
  slug?: string; // category or product slug
}

export interface EditorState {
  business: BusinessConfig;
  theme: BusinessTheme | null;
  translations: Record<string, string>;
  particleIcons: ParticleIcon[];
  menu: Categoria[];
}

interface EditorContextValue {
  state: EditorState;
  initial: EditorState;
  selected: SelectedElement | null;
  isDirty: boolean;
  canUndo: boolean;
  undo: () => void;
  deviceMode: "desktop" | "mobile";
  selectElement: (el: SelectedElement | null) => void;
  setDeviceMode: (mode: "desktop" | "mobile") => void;
  updateBusiness: (patch: Partial<BusinessConfig>) => void;
  updateTheme: (patch: Partial<BusinessTheme>) => void;
  updateTranslation: (key: string, value: string) => void;
  updateParticleIcons: (icons: ParticleIcon[]) => void;
  updateCategory: (slug: string, patch: Partial<Categoria>) => void;
  updateCategoryItem: (
    categorySlug: string,
    productSlug: string,
    patch: Partial<Producto>,
  ) => void;
  updateCategoryItems: (
    categorySlug: string,
    items: Producto[],
  ) => void;
  /** Replace the whole menu (e.g. after a CRUD action persisted via a Sheet). */
  setMenu: (menu: Categoria[]) => void;
  /** Reload the menu from the database and sync the editor baseline. */
  reloadMenu: () => Promise<void>;
  /** Scroll container for the desktop preview (overflow-auto div). */
  scrollContainer: HTMLElement | null;
  setScrollContainer: (el: HTMLElement | null) => void;
}

const EditorCtx = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorCtx);
  if (!ctx) throw new Error("useEditor must be used inside EditorProvider");
  return ctx;
}

interface EditorProviderProps {
  children: ReactNode;
  initialState: EditorState;
}

export function EditorProvider({ children, initialState }: EditorProviderProps) {
  const [state, setState] = useState<EditorState>(initialState);
  const [selected, setSelected] = useState<SelectedElement | null>(null);
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [baseline, setBaseline] = useState<EditorState>(initialState);
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(
    null,
  );

  // Undo history (snapshots taken before each mutation).
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const [history, setHistory] = useState<EditorState[]>([]);

  const recordHistory = useCallback(() => {
    setHistory((h) => [...h.slice(-49), stateRef.current]);
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      const previous = h[h.length - 1];
      setState(previous);
      return h.slice(0, -1);
    });
  }, []);

  const isDirty = JSON.stringify(state) !== JSON.stringify(baseline);
  const canUndo = history.length > 0;

  const selectElement = useCallback(
    (el: SelectedElement | null) => setSelected(el),
    [],
  );

  const updateBusiness = useCallback(
    (patch: Partial<BusinessConfig>) => {
      recordHistory();
      setState((s) => ({ ...s, business: { ...s.business, ...patch } }));
    },
    [recordHistory],
  );

  const updateTheme = useCallback(
    (patch: Partial<BusinessTheme>) => {
      recordHistory();
      setState((s) => ({
        ...s,
        theme: s.theme ? { ...s.theme, ...patch } : (patch as BusinessTheme),
      }));
    },
    [recordHistory],
  );

  const updateTranslation = useCallback(
    (key: string, value: string) => {
      recordHistory();
      setState((s) => ({
        ...s,
        translations: { ...s.translations, [key]: value },
      }));
    },
    [recordHistory],
  );

  const updateParticleIcons = useCallback(
    (icons: ParticleIcon[]) => {
      recordHistory();
      setState((s) => ({ ...s, particleIcons: icons }));
    },
    [recordHistory],
  );

  const updateCategory = useCallback(
    (slug: string, patch: Partial<Categoria>) => {
      recordHistory();
      setState((s) => ({
        ...s,
        menu: s.menu.map((cat) =>
          cat.id === slug ? { ...cat, ...patch } : cat,
        ),
      }));
    },
    [recordHistory],
  );

  const updateCategoryItem = useCallback(
    (categorySlug: string, productSlug: string, patch: Partial<Producto>) => {
      recordHistory();
      setState((s) => ({
        ...s,
        menu: s.menu.map((cat) =>
          cat.id !== categorySlug
            ? cat
            : {
                ...cat,
                items: cat.items.map((item) =>
                  item.nombre === productSlug
                    ? { ...item, ...patch }
                    : item,
                ),
              },
        ),
      }));
    },
    [recordHistory],
  );

  const updateCategoryItems = useCallback(
    (categorySlug: string, items: Producto[]) => {
      recordHistory();
      setState((s) => ({
        ...s,
        menu: s.menu.map((cat) =>
          cat.id === categorySlug ? { ...cat, items } : cat,
        ),
      }));
    },
    [recordHistory],
  );

  const setMenu = useCallback((menu: Categoria[]) => {
    // CRUD persisted externally — sync state and baseline so it isn't "dirty".
    setState((s) => ({ ...s, menu }));
    setBaseline((b) => ({ ...b, menu }));
    setHistory([]);
  }, []);

  const reloadMenu = useCallback(async () => {
    const { getEditorMenu } = await import("@/app/actions/editor");
    const fresh = await getEditorMenu();
    if (fresh) setMenu(fresh);
  }, [setMenu]);

  const value: EditorContextValue = {
    state,
    initial: baseline,
    selected,
    isDirty,
    canUndo,
    undo,
    deviceMode,
    selectElement,
    setDeviceMode,
    updateBusiness,
    updateTheme,
    updateTranslation,
    updateParticleIcons,
    updateCategory,
    updateCategoryItem,
    updateCategoryItems,
    setMenu,
    reloadMenu,
    scrollContainer,
    setScrollContainer,
  };

  return <EditorCtx.Provider value={value}>{children}</EditorCtx.Provider>;
}
