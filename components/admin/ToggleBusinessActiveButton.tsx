"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Power, PowerOff } from "lucide-react";
import { toggleBusinessActive } from "@/app/actions/businesses";
import { toast } from "sonner";

interface Props {
  id: string;
  isActive: boolean;
}

export function ToggleBusinessActiveButton({ id, isActive }: Props) {
  const [pending, start] = useTransition();
  const [current, setCurrent] = useState(isActive);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        start(async () => {
          const result = await toggleBusinessActive(id, !current);
          if (result.error) {
            toast.error(result.error);
          } else {
            setCurrent(!current);
            toast.success(current ? "Negocio desactivado" : "Negocio activado");
          }
        });
      }}
    >
      {current ? (
        <>
          <PowerOff className="mr-1.5 size-3.5" aria-hidden="true" />
          Desactivar
        </>
      ) : (
        <>
          <Power className="mr-1.5 size-3.5" aria-hidden="true" />
          Activar
        </>
      )}
    </Button>
  );
}
