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

export default function ImagenesPage() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (validation) {
      toast.error(validation.message);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      let fileToUpload = file;
      let conversionInfo = "";
      if (file.type !== "image/svg+xml") {
        const result = await convertToWebP(file);
        fileToUpload = result.file;
        if (result.originalSize !== result.convertedSize) {
          const saved = (
            ((result.originalSize - result.convertedSize) /
              result.originalSize) *
            100
          ).toFixed(0);
          conversionInfo = `Optimizada: ${saved}% más liviana`;
        }
      }

      const formData = new FormData();
      formData.set("file", fileToUpload);
      formData.set("bucket", bucket);

      const result = await uploadImage(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(
          conversionInfo
            ? `Imagen subida. ${conversionInfo}`
            : "Imagen subida correctamente",
        );
        loadImages(bucket);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al procesar la imagen",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
            {images.length} {images.length === 1 ? "imagen" : "imágenes"} en el
            bucket
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
            {uploading ? "Subiendo…" : "Subir Imagen"}
          </Button>
        </div>
      </div>

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
                Subí tu primera imagen para empezar
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
