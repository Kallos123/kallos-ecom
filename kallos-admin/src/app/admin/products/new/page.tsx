import { PageHeader } from "@/components/admin/sidebar";
import { DetailsForm } from "../_components/details-form";

export default function NewProductPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        breadcrumb={["Products"]}
        title="New Product"
        subtitle="Create a product, then add variants and images"
      />
      <div
        className="rounded-2xl p-6"
        style={{
          background: "oklch(1 0 0)",
          boxShadow: "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 14px -3px oklch(0 0 0 / 0.06)",
        }}
      >
        <DetailsForm />
      </div>
    </div>
  );
}
