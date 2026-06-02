"use client";

import {
  useEditor,
  type SelectedElementType,
} from "./EditorContext";
import MenuLandingClient from "@/app/components/MenuLandingClient";
import { EditableWrapper } from "./EditableWrapper";

/**
 * Wraps MenuLandingClient with editorial state from EditorContext.
 * In editor mode, each section gets an EditableWrapper overlay.
 */
export function EditableLanding() {
  const { state, selected, selectElement, scrollContainer } = useEditor();

  function onSelect(el: { type: string; slug?: string }) {
    selectElement({ type: el.type as SelectedElementType, slug: el.slug });
  }

  // Build the config and menu from editor state
  const config = {
    business: state.business,
    theme: state.theme,
    translations: state.translations,
    particleIcons: state.particleIcons,
  };

  return (
    <EditableWrapper
      type="theme"
      slug={undefined}
      label="Tema (colores)"
      onSelect={onSelect}
      selected={selected}
    >
      <MenuLandingClient
        config={config}
        menu={state.menu}
        mode="editor"
        onSelectElement={onSelect}
        selectedElement={selected}
        scrollRoot={scrollContainer}
      />
    </EditableWrapper>
  );
}
