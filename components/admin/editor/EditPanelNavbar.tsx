"use client";

import { useEditor } from "./EditorContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePicker } from "../ImagePicker";
import { X } from "lucide-react";

export function EditPanelNavbar() {
  const { state, updateBusiness } = useEditor();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Nombre del negocio</Label>
        <Input
          value={state.business.name}
          onChange={(e) => updateBusiness({ name: e.target.value })}
        />
      </div>
      <ImagePicker
        value={state.business.logoDesktop}
        onChange={(url) => updateBusiness({ logoDesktop: url })}
        bucket="logos"
        label="Logo Desktop"
      />
      <div className="flex flex-col gap-2">
        <Label>Logos Mobile</Label>
        {state.business.logoMobile.map((url, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1">
              <ImagePicker
                value={url}
                onChange={(newUrl) => {
                  const next = [...state.business.logoMobile];
                  next[i] = newUrl;
                  updateBusiness({ logoMobile: next });
                }}
                bucket="logos"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const next = state.business.logoMobile.filter((_, idx) => idx !== i);
                updateBusiness({ logoMobile: next });
              }}
              className="mt-6 text-destructive hover:text-destructive/80"
              aria-label={`Quitar logo mobile ${i + 1}`}
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            updateBusiness({
              logoMobile: [...state.business.logoMobile, ""],
            })
          }
          className="text-xs text-primary hover:text-primary/80"
        >
          + Añadir logo
        </button>
      </div>
    </div>
  );
}
