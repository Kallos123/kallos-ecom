"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/admin/sidebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailsForm } from "../_components/details-form";
import { VariantsManager } from "../_components/variants-manager";
import { ImagesManager } from "../_components/images-manager";
import { ArrowLeft, Package2, Layers, ImageIcon } from "lucide-react";

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

interface ProductVariant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  priceOverride: number | null;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  isActive: boolean;
  isFeatured: boolean;
  category: { id: string; name: string } | null;
  subcategory: { id: string; name: string } | null;
  tags: { tag: string }[];
  images: ProductImage[];
  variants: ProductVariant[];
}

interface ProductResponse {
  data: Product;
}

function LoadingSkeleton() {
  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div
        className="rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: "oklch(1 0 0)",
          boxShadow: "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 14px -3px oklch(0 0 0 / 0.06)",
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery<ProductResponse>({
    queryKey: ["product", params.id],
    queryFn: () => api.get(`/products/${params.id}`),
  });

  if (isLoading) return <LoadingSkeleton />;

  const product = data?.data;
  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-[13px] font-mono text-muted-foreground">
          Product not found
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        breadcrumb={["Products"]}
        title={product.name}
        subtitle={product.slug}
        action={
          <button
            onClick={() => router.back()}
            className="h-9 px-4 rounded-full text-[11px] font-mono font-medium flex items-center gap-2 transition-all hover:opacity-80"
            style={{
              border: "1px solid oklch(0.88 0.008 65)",
              color: "oklch(0.42 0.008 65)",
              background: "oklch(1 0 0)",
            }}
          >
            <ArrowLeft size={12} />
            Back
          </button>
        }
      />

      <Tabs defaultValue="details">
        <TabsList className="mb-6 h-9 p-1 gap-1" style={{ background: "oklch(0.96 0.004 65)", borderRadius: "9999px" }}>
          <TabsTrigger
            value="details"
            className="gap-1.5 text-[11px] font-mono tracking-wide rounded-full px-4 data-active:bg-white data-active:shadow-sm"
            style={{ height: "calc(100% - 0px)" }}
          >
            <Package2 size={13} />
            Details
          </TabsTrigger>
          <TabsTrigger
            value="variants"
            className="gap-1.5 text-[11px] font-mono tracking-wide rounded-full px-4 data-active:bg-white data-active:shadow-sm"
          >
            <Layers size={13} />
            Variants
            <span className="ml-0.5 text-[10px] font-mono opacity-60">
              ({product.variants.length})
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="images"
            className="gap-1.5 text-[11px] font-mono tracking-wide rounded-full px-4 data-active:bg-white data-active:shadow-sm"
          >
            <ImageIcon size={13} />
            Images
            <span className="ml-0.5 text-[10px] font-mono opacity-60">
              ({product.images.length})
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div
            className="rounded-2xl p-6"
            style={{
              background: "oklch(1 0 0)",
              boxShadow: "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 14px -3px oklch(0 0 0 / 0.06)",
            }}
          >
            <DetailsForm
              productId={product.id}
              defaultValues={{
                name: product.name,
                slug: product.slug,
                description: product.description ?? "",
                categoryId: product.category?.id ?? "",
                subcategoryId: product.subcategory?.id ?? "",
                tags: product.tags.map((t) => t.tag).join(", "),
                basePrice: product.basePrice,
                isActive: product.isActive,
                isFeatured: product.isFeatured,
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="variants">
          <div
            className="rounded-2xl p-6"
            style={{
              background: "oklch(1 0 0)",
              boxShadow: "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 14px -3px oklch(0 0 0 / 0.06)",
            }}
          >
            <VariantsManager
              productId={product.id}
              variants={product.variants}
              basePrice={product.basePrice}
            />
          </div>
        </TabsContent>

        <TabsContent value="images">
          <div
            className="rounded-2xl p-6"
            style={{
              background: "oklch(1 0 0)",
              boxShadow: "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 14px -3px oklch(0 0 0 / 0.06)",
            }}
          >
            <ImagesManager
              productId={product.id}
              images={product.images}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
