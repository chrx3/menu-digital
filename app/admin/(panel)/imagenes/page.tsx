"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { listImages, uploadImage, deleteImage } from "@/app/actions/images";
import { validateImageFile, convertToWebP } from "@/app/lib/image-utils";
import {
  Loader2,
  Upload,
  Trash2,
  Copy,
  Check,
  Image as ImageIcon,
} from "lucide-react";

const BUCKET_LABELS: Record<string, string> = {
  products: "Productos",
  logos: "Logos",
};

interface ImageFile {
  name: string;
  url: string;
  size: number;
  created: string;
}

interface UploadJob {
  id: string;
  fileName: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export default function ImagenesPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [bucket, setBucket] = useState("products");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadImages(bucket);
  }, [bucket]);

  async function loadImages(selectedBucket: string) {
    setLoading(true);
    const result = await listImages(selectedBucket);
    if (result.error) {
      toast.error(result.error);
    } else {
      setImages(result.files || []);
    }
    setLoading(false);
  }

  const uploading = jobs.some((j) => j.status === "uploading" || j.status === "pending");

  async function processFile(file: File): Promise<{ ok: true; formData: FormData; conversionInfo: string } | { ok: false; error: string }> {
    const validation = validateImageFile(file);
    if (validation) return { ok: false, error: validation.message };

    let fileToUpload = file;
    let conversionInfo = "";
    if (file.type !== "image/svg+xml") {
      const result = await convertToWebP(file);
      fileToUpload = result.file;
      if (result.originalSize !== result.convertedSize) {
        const saved = (
          ((result.originalSize - result.convertedSize) / result.originalSize) *
          100
        ).toFixed(0);
        conversionInfo = `Optimizada: ${saved}% más liviana`;
      }
    }

    const formData = new FormData();
    formData.set("file", fileToUpload);
    formData.set("bucket", bucket);
    return { ok: true, formData, conversionInfo };
  }

  async function uploadOne(file: File, jobId: string) {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: "uploading" } : j)));
    const result = await processFile(file);
    if (!result.ok) {
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: "error", error: result.error } : j)));
      return;
    }
    const r = await uploadImage(result.formData);
    if (r.error) {
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: "error", error: r.error } : j)));
    } else {
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: "done" } : j)));
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const newJobs: UploadJob[] = files.map((f) => ({
      id: crypto.randomUUID(),
      fileName: f.name,
      status: "pending",
    }));
    setJobs((prev) => [...prev, ...newJobs]);

    // ponytail: run uploads in parallel but with a small concurrency cap.
    const CONCURRENCY = 3;
    const queue = [...files.entries()];
    const idMap = new Map<number, string>();
    files.forEach((_, i) => idMap.set(i, newJobs[i].id));

    async function worker() {
      while (queue.length > 0) {
        const [idx, file] = queue.shift()!;
        await uploadOne(file, idMap.get(idx)!);
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker()));

    const failed = newJobs.filter((j) => j.status === "error").length;
    const succeeded = newJobs.length - failed;
    if (succeeded > 0) toast.success(`${succeeded} subida(s) OK${failed ? `, ${failed} fallaron` : ""}`);
    loadImages(bucket);
  }

  function clearDone() {
    setJobs((prev) => prev.filter((j) => j.status === "uploading" || j.status === "pending"));
  }

  const handleDelete = async (name: string) => {
    if (!window.confirm(`¿Eliminar "${name}"?`)) return;
    const result = await deleteImage(name, bucket);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`"${name}" eliminada`);
      loadImages(bucket);
    }
  };

  const handleCopyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success("URL copiada al portapapeles");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Imágenes</h1>
          <p className="text-muted-foreground">
            {images.length} {images.length === 1 ? "imagen" : "imágenes"} en el bucket
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border bg-muted p-0.5">
            {["products", "logos"].map((b) => (
              <button
                key={b}
                onClick={() => setBucket(b)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  bucket === b
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {BUCKET_LABELS[b] ?? b}
              </button>
            ))}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/webp,image/jpeg,image/png,image/svg+xml"
            onChange={handleUpload}
            className="hidden"
            id="file-upload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Upload className="mr-2 size-4" />
            )}
            {uploading ? `Subiendo ${jobs.filter((j) => j.status === "uploading" || j.status === "pending").length}…` : "Subir Imágenes"}
          </Button>
        </div>
      </div>

      {jobs.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium">
                Cola de subida ({jobs.length})
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearDone}
                disabled={uploading}
              >
                Limpiar finalizadas
              </Button>
            </div>
            <ul className="flex flex-col gap-1">
              {jobs.map((j) => (
                <li
                  key={j.id}
                  className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1 text-xs"
                >
                  {j.status === "pending" && <span className="size-2 rounded-full bg-muted-foreground/40" />}
                  {j.status === "uploading" && <Loader2 className="size-3 animate-spin" />}
                  {j.status === "done" && <Check className="size-3 text-emerald-600" />}
                  {j.status === "error" && <span className="text-destructive">✕</span>}
                  <span className="flex-1 truncate">{j.fileName}</span>
                  {j.error && <span className="text-destructive">{j.error}</span>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : images.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 gap-3">
            <ImageIcon className="size-10 text-muted-foreground/40" />
            <div className="text-center">
              <p className="font-medium">No hay imágenes</p>
              <p className="text-sm text-muted-foreground">
                Subí tus primeras imágenes (puedes seleccionar varias a la vez)
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((img) => (
            <Card key={img.name} className="group overflow-hidden">
              <div className="aspect-square bg-muted relative overflow-hidden">
                <Image
                  src={img.url}
                  alt={img.name}
                  className="object-cover"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  unoptimized
                />
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/15 opacity-100 transition-[background-color,opacity] sm:bg-black/0 sm:opacity-0 sm:group-hover:bg-black/30 sm:group-hover:opacity-100 sm:group-focus-within:bg-black/30 sm:group-focus-within:opacity-100">
                  <Button
                    size="icon-xs"
                    variant="secondary"
                    onClick={() => handleCopyUrl(img.url)}
                    title="Copiar URL"
                    aria-label={`Copiar URL de ${img.name}`}
                  >
                    {copiedUrl === img.url ? (
                      <Check className="size-3" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="destructive"
                    onClick={() => handleDelete(img.name)}
                    title="Eliminar"
                    aria-label={`Eliminar ${img.name}`}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-xs font-medium truncate" title={img.name}>
                  {img.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatSize(img.size)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
