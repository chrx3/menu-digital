"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { createBusiness } from "@/app/actions/businesses";
import { useDirtyGuard } from "@/app/hooks/useDirtyGuard";
import { toast } from "sonner";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function NewBusinessForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [pending, start] = useTransition();
  const [dirty, setDirty] = useState(false);
  useDirtyGuard(dirty);

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Datos del negocio</CardTitle>
        <CardDescription>
          El slug debe ser único y solo contener letras minúsculas, números y guiones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData();
            fd.set("name", name.trim());
            fd.set("slug", slug.trim());
            start(async () => {
              const result = await createBusiness(fd);
              if (result.error) {
                toast.error(result.error);
                return;
              }
              setDirty(false);
              toast.success("Negocio creado");
              router.push("/admin/negocios");
              router.refresh();
            });
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
                setDirty(true);
              }}
              maxLength={120}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="slug">Slug (subdominio)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase());
                setDirty(true);
              }}
              pattern="^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$"
              minLength={2}
              maxLength={60}
              required
            />
            <p className="text-xs text-muted-foreground">
              Será accesible en <code>https://{slug || "slug"}.chrsx3.com</code>.
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="mr-1.5 size-4" aria-hidden="true" />
              )}
              Crear negocio
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
