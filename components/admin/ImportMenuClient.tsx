"use client";

import { useState, useTransition, useRef } from "react";
import { Loader2, FileUp, CheckCircle2, AlertCircle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { applyImportedMenu } from "@/app/actions/import-menu";
import type { ImportMenu } from "@/app/lib/import-menu-schema";

interface Props {
  businessName: string;
}

type JobStatus = "queued" | "analyzing" | "ready" | "applied" | "error";

interface ImportJob {
  id: string;
  fileName: string;
  status: JobStatus;
  result?: ImportMenu;
  error?: string;
}

export function ImportMenuClient({ businessName }: Props) {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [analyzing, startAnalyze] = useTransition();
  const [applying, startApply] = useTransition();
  // ponytail: <input> only gives us File handles on the change event.
  // Cache them by name so the async worker can fetch them later.
  const fileCache = useRef<Map<string, File>>(new Map());

  function cacheFiles(files: File[]) {
    for (const f of files) fileCache.current.set(f.name, f);
  }

  function pickFile(name: string): File | undefined {
    return fileCache.current.get(name);
  }

  async function runJob(job: ImportJob) {
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: "analyzing" } : j)));
    const file = pickFile(job.fileName);
    if (!file) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id ? { ...j, status: "error", error: "Archivo no encontrado" } : j,
        ),
      );
      return;
    }
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/import-menu", { method: "POST", body: fd });
      const json = (await res.json()) as { data?: ImportMenu; error?: string };
      if (json.error || !json.data) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id ? { ...j, status: "error", error: json.error ?? "Sin datos" } : j,
          ),
        );
      } else {
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, status: "ready", result: json.data } : j)),
        );
      }
    } catch (e) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? { ...j, status: "error", error: e instanceof Error ? e.message : "?" }
            : j,
        ),
      );
    }
  }

  async function runAll(newJobs: ImportJob[]) {
    // ponytail: cap concurrency to avoid rate limits.
    const CONCURRENCY = 3;
    const queue = newJobs.slice();
    async function worker() {
      while (queue.length > 0) {
        const job = queue.shift()!;
        await runJob(job);
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker()),
    );
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    cacheFiles(files);
    const newJobs: ImportJob[] = files.map((f) => ({
      id: crypto.randomUUID(),
      fileName: f.name,
      status: "queued",
    }));
    setJobs((prev) => [...prev, ...newJobs]);
    startAnalyze(() => runAll(newJobs));
    e.target.value = "";
  }

  function clearJob(id: string) {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  function clearAll() {
    setJobs([]);
  }

  function applyAll() {
    const ready = jobs.filter((j) => j.status === "ready" && j.result);
    if (ready.length === 0) return;
    startApply(async () => {
      let totalCats = 0;
      let totalProds = 0;
      for (const j of ready) {
        const r = await applyImportedMenu(j.result!);
        if (r.error) {
          toast.error(`${j.fileName}: ${r.error}`);
        } else {
          totalCats += r.data?.createdCats ?? 0;
          totalProds += r.data?.createdProds ?? 0;
          setJobs((prev) =>
            prev.map((p) => (p.id === j.id ? { ...p, status: "applied" } : p)),
          );
        }
      }
      if (totalCats > 0 || totalProds > 0) {
        toast.success(`Listo: ${totalCats} categorías, ${totalProds} productos`);
      }
    });
  }

  const readyCount = jobs.filter((j) => j.status === "ready").length;
  const totalCats = jobs.reduce((acc, j) => acc + (j.result?.categories.length ?? 0), 0);
  const totalProds = jobs.reduce(
    (acc, j) => acc + (j.result?.categories.reduce((a, c) => a + c.productos.length, 0) ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Sube uno o varios menús</CardTitle>
          <CardDescription>
            PDF, PNG, JPEG o WebP. Cada archivo se analiza con IA por separado. Los archivos no se guardan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-6 py-10 text-sm transition-colors hover:bg-muted/50">
              <FileUp className="size-6 text-muted-foreground" aria-hidden="true" />
              <span className="font-medium">Click para subir</span>
              <span className="text-xs text-muted-foreground">
                PDF, PNG, JPEG o WebP — máx 8 MB por archivo — puedes seleccionar varios
              </span>
              <input
                type="file"
                multiple
                accept="application/pdf,image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={handleSelect}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>2. Resultados del análisis</CardTitle>
            <CardDescription>
              {jobs.length} archivo{jobs.length === 1 ? "" : "s"} —{" "}
              <strong>{readyCount}</strong> listo{readyCount === 1 ? "" : "s"} para aplicar.
              {readyCount > 0 && (
                <>
                  {" "}Detectado: <strong>{totalCats}</strong> categorías,{" "}
                  <strong>{totalProds}</strong> productos para {businessName}.
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {jobs.map((j) => (
                <li
                  key={j.id}
                  className="flex flex-col gap-2 rounded-md border bg-background p-3"
                >
                  <div className="flex items-center gap-2">
                    {j.status === "queued" && (
                      <span className="text-xs text-muted-foreground">⏱ En cola</span>
                    )}
                    {j.status === "analyzing" && (
                      <>
                        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                        <span className="text-xs">Analizando…</span>
                      </>
                    )}
                    {j.status === "ready" && (
                      <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden="true" />
                    )}
                    {j.status === "applied" && (
                      <CheckCircle2 className="size-3.5 text-blue-600" aria-hidden="true" />
                    )}
                    {j.status === "error" && (
                      <AlertCircle className="size-3.5 text-destructive" aria-hidden="true" />
                    )}
                    <span className="flex-1 truncate text-sm font-medium">{j.fileName}</span>
                    {j.result && (
                      <span className="text-xs text-muted-foreground">
                        {j.result.categories.length} cat ·{" "}
                        {j.result.categories.reduce((acc, c) => acc + c.productos.length, 0)} prod
                      </span>
                    )}
                    {j.error && (
                      <span className="text-xs text-destructive">{j.error}</span>
                    )}
                    {j.status !== "analyzing" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => clearJob(j.id)}
                        aria-label={`Quitar ${j.fileName}`}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                  {j.result && j.result.categories.length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Ver detalle
                      </summary>
                      <ul className="mt-1.5 flex max-h-48 flex-col gap-1 overflow-y-auto pl-4 text-muted-foreground">
                        {j.result.categories.map((c) => (
                          <li key={c.slug ?? c.titulo}>
                            <span className="font-medium text-foreground">{c.titulo}</span>{" "}
                            ({c.productos.length} productos
                            {c.tipo_precio !== "unico" ? ` · ${c.tipo_precio}` : ""})
                            {c.productos.length > 0 && (
                              <span className="block pl-3 text-[10px]">
                                {c.productos
                                  .slice(0, 3)
                                  .map((p) => p.nombre)
                                  .join(", ")}
                                {c.productos.length > 3 ? "…" : ""}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <Button onClick={applyAll} disabled={readyCount === 0 || applying}>
                {applying ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden="true" />
                    Aplicando…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 size-4" aria-hidden="true" />
                    Aplicar {readyCount} resultado{readyCount === 1 ? "" : "s"} a {businessName}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={clearAll} disabled={analyzing || applying}>
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
