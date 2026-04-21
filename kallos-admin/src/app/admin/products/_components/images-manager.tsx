"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, X, Loader2, GripVertical } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

interface ImagesManagerProps {
  productId: string;
  images: ProductImage[];
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImagesManager({ productId, images }: ImagesManagerProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string[]>([]);

  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) =>
      api.delete(`/products/${productId}/images/${imageId}`),
    onSuccess: () => {
      toast.success("Image removed");
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    // Preview immediately
    const previews = await Promise.all(files.map(fileToBase64));
    setPreview(previews);
    setUploading(true);

    try {
      // Upload sequentially to backend (which sends to Cloudinary)
      for (const base64 of previews) {
        await api.post(`/products/${productId}/images`, { image: base64 });
      }
      toast.success(`${files.length} image${files.length > 1 ? "s" : ""} uploaded`);
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    } catch (err) {
      toast.error((err as Error).message ?? "Upload failed");
    } finally {
      setUploading(false);
      setPreview([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Image grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Existing images */}
        {sorted.map((img) => (
          <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 3px oklch(0 0 0 / 0.08)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.altText ?? "Product image"}
              className="w-full h-full object-cover"
            />
            {/* Order badge */}
            <div className="absolute top-1.5 left-1.5 rounded-md bg-background/85 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground flex items-center gap-1">
              <GripVertical size={9} />
              {img.sortOrder + 1}
            </div>
            {/* Delete */}
            <button
              onClick={() => deleteMutation.mutate(img.id)}
              disabled={deleteMutation.isPending}
              className="absolute top-1.5 right-1.5 size-6 rounded-lg bg-background/90 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
            >
              {deleteMutation.isPending ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <X size={11} />
              )}
            </button>
          </div>
        ))}

        {/* Upload preview tiles */}
        {uploading &&
          preview.map((src, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-xl overflow-hidden border border-primary/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="Uploading..." className="w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                <Loader2 size={20} className="animate-spin text-primary" />
              </div>
            </div>
          ))}

        {/* Upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "aspect-square rounded-xl flex flex-col items-center justify-center gap-2 transition-colors",
            uploading && "opacity-40 cursor-not-allowed"
          )}
          style={{
            border: "1.5px dashed oklch(0.82 0.008 65)",
            color: "oklch(0.62 0.008 65)",
            background: "oklch(0.992 0.003 65)",
          }}
          onMouseEnter={(e) => {
            if (!uploading) {
              (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.55 0.20 18 / 0.5)";
              (e.currentTarget as HTMLElement).style.color = "oklch(0.55 0.20 18)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.82 0.008 65)";
            (e.currentTarget as HTMLElement).style.color = "oklch(0.62 0.008 65)";
          }}
        >
          <ImagePlus size={20} strokeWidth={1.5} />
          <span className="text-[10px] font-mono">Upload</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleUpload}
      />

      <p className="text-[11px] font-mono text-muted-foreground">
        {sorted.length > 0
          ? `${sorted.length} image${sorted.length > 1 ? "s" : ""}. First image is used as thumbnail.`
          : "No images yet. Upload product images above."}
      </p>
    </div>
  );
}
