"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { uploadImage } from "@/app/actions/images";
import { listImages } from "@/app/actions/images";
import {
  validateImageFile,
  convertToWebP,
  extractStorageFileName,
} from "@/app/lib/image-utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Upload,
  ImageIcon,
  Check,
  X,
  Search,
} from "lucide-react";

interface ImageFile {
  name: string;
  url: string;
  size: number;
  created: string;
}

interface ImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: "products" | "logos";
  label?: string;
  placeholder?: string;
}

export function ImagePicker({
  value,
  onChange,
  bucket = "products",
  label = "Imagen",
  placeholder = "/products/imagen.webp",
}: ImagePickerProps) {
  const [uploading, setUploading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<ImageFile[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryQuery, setGalleryQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewError(false);
  }, [value]);

  async function openGallery() {
    setGalleryOpen(true);
    setGalleryLoading(true);
    const result = await listImages(bucket);
    if (result.error) {
      toast.error(result.error);
    } else {
      setGalleryImages(result.files || []);
    }
    setGalleryLoading(false);
  }

  const filteredImages = galleryImages.filter((img) =>
    img.name.toLowerCase().includes(galleryQuery.toLowerCase()),
  );

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;
    e.target.value = "";

    const validation = validateImageFile(rawFile);
    if (validation) {
      toast.error(validation.message);
      return;
    }

    setUploading(true);
    try {
      let fileToUpload: File;
      let conversionInfo = "";

      if (rawFile.type === "image/svg+xml") {
        fileToUpload = rawFile;
      } else {
        const result = await convertToWebP(rawFile);
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

      // If replacing an existing storage image, clean up the old one
      const oldName = value ? extractStorageFileName(value, bucket) : undefined;
      if (oldName) {
        formData.set("replace_url", value);
      }

      const result = await uploadImage(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success && result.url) {
        onChange(result.url);
        toast.success(
          conversionInfo
            ? `Imagen subida. ${conversionInfo}`
            : "Imagen subida correctamente",
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al procesar la imagen",
      );
    } finally {
      setUploading(false);
    }
  }

  function handleSelectFromGallery(url: string) {
    onChange(url);
    setGalleryOpen(false);
  }

  function handleClear() {
    onChange("");
  }

  const hasImage = Boolean(value.trim());

  return (
    <div className="flex flex-col gap-2">
      {label && <Label>{label}</Label>}

      {/* Preview */}
      <div className="flex items-start gap-3">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {hasImage && !previewError ? (
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-cover"
              sizes="80px"
              onError={() => setPreviewError(true)}
              unoptimized
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-3.5 w-3.5" />
              )}
              Subir
            </Button>

            <Sheet open={galleryOpen} onOpenChange={setGalleryOpen}>
              <SheetTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openGallery}
                  >
                    <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
                    Galería
                  </Button>
                }
              />
              <SheetContent
                side="right"
                className="w-full max-w-lg overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle>Galería de Imágenes</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={galleryQuery}
                      onChange={(e) => setGalleryQuery(e.target.value)}
                      placeholder="Buscar por nombre…"
                      className="pl-9"
                    />
                  </div>

                  {galleryLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredImages.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      {galleryQuery
                        ? "No se encontraron imágenes"
                        : "No hay imágenes en este bucket"}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {filteredImages.map((img) => {
                        const selected = value === img.url;
                        return (
                          <button
                            key={img.name}
                            type="button"
                            onClick={() => handleSelectFromGallery(img.url)}
                            className={`group relative aspect-square overflow-hidden rounded-lg border transition-all ${
                              selected
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <Image
                              src={img.url}
                              alt={img.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 33vw, 25vw"
                              unoptimized
                            />
                            {selected && (
                              <div className="absolute right-1 top-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                              {img.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {hasImage && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-destructive hover:text-destructive"
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Quitar
              </Button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/webp,image/jpeg,image/png,image/svg+xml"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
