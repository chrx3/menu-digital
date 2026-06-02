"use client";

import { useEditor } from "./EditorContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditPanelFooter() {
  const { state, updateTranslation, updateBusiness } = useEditor();

  const copyright =
    state.translations["footer.copyright"] ||
    "© {year} {name}. Todos los derechos reservados";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Texto de copyright</Label>
        <Input
          value={copyright}
          onChange={(e) => updateTranslation("footer.copyright", e.target.value)}
        />
        <p className="text-[10px] text-muted-foreground">
          Usa <code className="bg-muted px-1 rounded">{`{year}`}</code> para el año y{" "}
          <code className="bg-muted px-1 rounded">{`{name}`}</code> para el nombre del negocio
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Año</Label>
        <Input
          type="number"
          value={state.business.year}
          onChange={(e) => updateBusiness({ year: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}
