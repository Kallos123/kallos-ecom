import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, error, required, children, className }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-[11px] font-mono tracking-[0.15em] uppercase text-muted-foreground">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] font-mono text-destructive">{error}</p>}
    </div>
  );
}

export const inputCls =
  "w-full h-10 rounded-xl bg-input border border-border px-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors";

export const inputErrCls = "border-destructive";
