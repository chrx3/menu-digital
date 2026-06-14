"use client";

import { useState, useTransition } from "react";
import { Loader2, FileUp, CheckCircle2, AlertCircle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { applyImportedMenu } from "@/app/actions/import-menu";
import type { ImportMenu } from "@/app/lib/import-menu-schema";

interface Props {
  businessName: string;
}

export function ImportMenuForm({ businessName }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportMenu | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, startAnalyze] = useTransition();
  const [applying, startApply] = useTransition();

  function handleFile(f: File | null) {
    setFile(f);
    setResult(null);
    setError(null);
  }

  function analyze() {
    if (!file) return;
    setError(null);
    setResult(null);
    startAnalyze(async () => {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/import-menu", { method: "POST", body: fd });
      const json = (await res.json()) as { data?: ImportMenu; error?: string };
      if (json.error) {
        setError(json.error);
        toast.error(json.error);
        return;
      }
      if (json.data) {
        setResult(json.data);
        toast.success(`Detectadas ${json.data.categories.length} categorías`);
      }
    });
  }

  function apply() {
    if (!result) return;
    startApply(async () => {
      const r = await applyImportedMenu(result);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(
        `Listo: ${r.data?.createdCats ?? 0} categorías, ${r.data?.createdProds ?? 0} productos`,
      );
      setResult(null);
      setFile(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Sube el menú</CardTitle>
          <CardDescription>
            PDF, PNG, JPEG o WebP. La imagen se procesa y se descarta — no se guarda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {file ? (
              <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span className="truncate">{file.name} ({Math.round(file.size / 1024)} KB)</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleFile(null)}
                  aria-label="Quitar archivo"
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-6 py-10 text-sm transition-colors hover:bg-muted/50">
                <FileUp className="size-6 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium">Click para subir</span>
                <span className="text-xs text-muted-foreground">PDF, PNG, JPEG o WebP — máx 8 MB</span>
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
            <Button onClick={analyze} disabled={!file || analyzing} className="self-start">
              {analyzing ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden="true" />
                  Analizando…
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 size-4" aria-hidden="true" />
                  Analizar con IA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-start gap-2 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>2. Revisa y aplica</CardTitle>
            <CardDescription>
              La IA detectó <strong>{result.categories.length}</strong> categorías con{" "}
              <strong>
                {result.categories.reduce((acc, c) => acc + c.productos.length, 0)}
              </strong>{" "}
              productos para {businessName}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto rounded-md border bg-muted/30 p-3 text-sm">
              {result.categories.map((c) => (
                <li key={c.slug ?? c.titulo} className="rounded-md bg-background p-3">
                  <p className="font-medium">
                    {c.titulo}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({c.productos.length} productos
                      {c.tipo_precio !== "unico" ? ` · ${c.tipo_precio}` : ""})
                    </span>
                  </p>
                  {c.productos.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                      {c.productos.slice(0, 5).map((p) => (
                        <li key={p.slug ?? p.nombre}>
                          {p.nombre}
                          {p.precio ? ` — $${p.precio.toLocaleString("es-CL")}` : ""}
                          {p.opciones?.length ? ` (${p.opciones.length} opciones)` : ""}
                        </li>
                      ))}
                      {c.productos.length > 5 && (
                        <li className="list-none text-xs italic">
                          +{c.productos.length - 5} más…
                        </li>
                      )}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <Button onClick={apply} disabled={applying}>
                {applying ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden="true" />
                    Aplicando…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 size-4" aria-hidden="true" />
                    Aplicar a {businessName}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setResult(null)}
                disabled={applying}
              >
                Descartar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
