"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  name: z.string().min(2, "Minimum 2 characters"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  subcategoryId: z.string().optional(),
  tags: z.string().optional(),
  basePrice: z.number().positive("Must be a positive number"),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

export type DetailsFormValues = z.infer<typeof schema>;

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

interface CategoriesResponse {
  data: Category[];
}

interface SubcategoriesResponse {
  data: Subcategory[];
}

interface DetailsFormProps {
  productId?: string;
  defaultValues?: Partial<DetailsFormValues>;
  onSuccess?: (productId: string) => void;
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function FormRow({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-mono tracking-[0.15em] uppercase text-muted-foreground">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[11px] font-mono text-destructive">{error}</p>
      )}
    </div>
  );
}

export function DetailsForm({
  productId,
  defaultValues,
  onSuccess,
}: DetailsFormProps) {
  const router = useRouter();
  const isEditing = Boolean(productId);

  const { data: catData, isLoading: catsLoading } = useQuery<CategoriesResponse>({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories"),
    staleTime: 5 * 60 * 1000,
  });
  const { data: subData } = useQuery<SubcategoriesResponse>({
    queryKey: ["subcategories"],
    queryFn: () => api.get("/categories/subcategories"),
    staleTime: 5 * 60 * 1000,
  });
  const categories = catData?.data ?? [];
  const allSubs = subData?.data ?? [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DetailsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      categoryId: "",
      tags: "",
      basePrice: 0,
      isActive: true,
      isFeatured: false,
      ...defaultValues,
    },
  });

  // Auto-generate slug from name (only when creating)
  const name = watch("name");
  useEffect(() => {
    if (!isEditing) {
      setValue("slug", slugify(name));
    }
  }, [name, isEditing, setValue]);

  const mutation = useMutation({
    mutationFn: async (values: DetailsFormValues) => {
      const payload = {
        ...values,
        subcategoryId: values.subcategoryId || undefined,
        tags: values.tags
          ? values.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };

      if (isEditing) {
        return api.patch<{ data: { id: string } }>(
          `/products/${productId}`,
          payload
        );
      }
      return api.post<{ data: { id: string } }>("/products", payload);
    },
    onSuccess: (res) => {
      const id = res.data.id;
      toast.success(isEditing ? "Product updated" : "Product created");
      if (onSuccess) {
        onSuccess(id);
      } else if (!isEditing) {
        router.push(`/admin/products/${id}`);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const inputClass =
    "w-full h-10 rounded-xl bg-input border border-border px-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors";

  return (
    <form
      onSubmit={handleSubmit((v) => mutation.mutate(v))}
      className="flex flex-col gap-5"
    >
      {/* Name + Slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormRow label="Product Name" error={errors.name?.message} required>
          <input
            {...register("name")}
            placeholder="e.g. Oversized Linen Shirt"
            className={cn(inputClass, errors.name && "border-destructive")}
          />
        </FormRow>

        <FormRow label="Slug" error={errors.slug?.message} required>
          <input
            {...register("slug")}
            placeholder="e.g. oversized-linen-shirt"
            className={cn(inputClass, errors.slug && "border-destructive")}
          />
        </FormRow>
      </div>

      {/* Description */}
      <FormRow label="Description" error={errors.description?.message}>
        <textarea
          {...register("description")}
          rows={4}
          placeholder="Product description..."
          className="w-full rounded-xl bg-input border border-border px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors resize-none"
        />
      </FormRow>

      {/* Category + Subcategory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormRow label="Category" error={errors.categoryId?.message} required>
          {catsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val);
                    setValue("subcategoryId", "");
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      "h-10 w-full rounded-xl bg-input text-[13px] border-border",
                      errors.categoryId && "border-destructive"
                    )}
                  >
                    <SelectValue placeholder="Select a category">
                      {field.value
                        ? categories.find((c) => c.id === field.value)?.name
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} align="start">
                    <SelectGroup>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FormRow>

        <FormRow label="Subcategory">
          {catsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Controller
              control={control}
              name="subcategoryId"
              render={({ field }) => {
                const selectedCatId = watch("categoryId");
                const subs = allSubs.filter((s) => s.categoryId === selectedCatId);
                return (
                  <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={subs.length === 0}>
                    <SelectTrigger className="h-10 w-full rounded-xl bg-input text-[13px] border-border">
                      <SelectValue placeholder={subs.length === 0 ? "No subcategories" : "Optional"}>
                        {field.value
                          ? subs.find((s) => s.id === field.value)?.name
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} align="start">
                      <SelectGroup>
                        <SelectItem value="">None</SelectItem>
                        {subs.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                );
              }}
            />
          )}
        </FormRow>
      </div>

      {/* Base Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormRow label="Base Price (₹)" error={errors.basePrice?.message} required>
          <input
            {...register("basePrice", { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="0.00"
            className={cn(inputClass, errors.basePrice && "border-destructive")}
          />
        </FormRow>
      </div>

      {/* Tags */}
      <FormRow label="Tags" error={errors.tags?.message}>
        <input
          {...register("tags")}
          placeholder="e.g. summer, linen, casual (comma-separated)"
          className={inputClass}
        />
      </FormRow>

      {/* Toggles */}
      <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-1">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono tracking-[0.15em] uppercase text-muted-foreground">
            Active
          </span>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono tracking-[0.15em] uppercase text-muted-foreground">
            Featured
          </span>
          <Controller
            control={control}
            name="isFeatured"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending}
          className="h-10 px-6 rounded-full bg-primary text-primary-foreground text-[11px] font-mono tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {(isSubmitting || mutation.isPending) && (
            <Loader2 size={12} className="animate-spin" />
          )}
          {isEditing ? "Save Changes" : "Create Product"}
        </button>
        {!isEditing && (
          <p className="text-[11px] font-mono text-muted-foreground">
            You can add variants and images after creating
          </p>
        )}
      </div>
    </form>
  );
}
