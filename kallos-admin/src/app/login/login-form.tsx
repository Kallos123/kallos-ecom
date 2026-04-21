"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import { loginAdmin, storeUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/admin";

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setServerError("");
    try {
      const user = await loginAdmin(data.email, data.password);
      storeUser(user);
      router.push(from);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background:
          "radial-gradient(ellipse 140% 80% at 50% -10%, oklch(0.93 0.018 45), oklch(0.985 0.006 65) 55%, oklch(0.975 0.010 55) 100%)",
      }}
    >
      {/* Very subtle crimson blush at top */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[220px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top, oklch(0.55 0.20 18 / 0.07), transparent 65%)",
        }}
      />

      <div className="relative z-10 w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-9">
          <Image
            src="/kallos-logo.png"
            alt="KALLOS"
            width={260}
            height={110}
            className="mx-auto object-contain"
            priority
          />
          <div className="mt-5 flex items-center gap-3 justify-center">
            <div
              className="h-px flex-1"
              style={{ background: "oklch(0.55 0.20 18 / 0.28)" }}
            />
            <span
              className="text-[10px] tracking-[0.35em] uppercase font-mono"
              style={{ color: "oklch(0.55 0.20 18 / 0.85)" }}
            >
              Admin Panel
            </span>
            <div
              className="h-px flex-1"
              style={{ background: "oklch(0.55 0.20 18 / 0.28)" }}
            />
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: "oklch(1 0 0)",
            boxShadow:
              "0 4px 6px -1px oklch(0 0 0 / 0.04), 0 12px 40px -8px oklch(0.55 0.20 18 / 0.10), 0 2px 4px -1px oklch(0 0 0 / 0.04)",
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label
                className="block text-[10px] tracking-[0.28em] uppercase font-mono"
                style={{ color: "oklch(0.50 0.010 65)" }}
              >
                Email Address
              </label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="admin@kallos.in"
                className={cn(
                  "w-full h-12 rounded-full px-5 text-sm transition-all duration-200 focus:outline-none",
                  errors.email
                    ? "border-2"
                    : "border focus:border-2"
                )}
                style={
                  errors.email
                    ? {
                        background: "oklch(0.982 0.006 65)",
                        color: "oklch(0.18 0.01 65)",
                        borderColor: "oklch(0.55 0.20 18)",
                        boxShadow: "0 0 0 3px oklch(0.55 0.20 18 / 0.12)",
                      }
                    : {
                        background: "oklch(0.982 0.006 65)",
                        color: "oklch(0.18 0.01 65)",
                        borderColor: "oklch(0.87 0.008 65)",
                      }
                }
                onFocus={(e) => {
                  if (!errors.email) {
                    e.currentTarget.style.borderColor = "oklch(0.55 0.20 18)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px oklch(0.55 0.20 18 / 0.10)";
                    e.currentTarget.style.borderWidth = "2px";
                  }
                }}
                onBlur={(e) => {
                  if (!errors.email) {
                    e.currentTarget.style.borderColor = "oklch(0.87 0.008 65)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderWidth = "1px";
                  }
                }}
              />
              {errors.email && (
                <p
                  className="text-[11px] font-mono pl-2"
                  style={{ color: "oklch(0.48 0.18 18)" }}
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                className="block text-[10px] tracking-[0.28em] uppercase font-mono"
                style={{ color: "oklch(0.50 0.010 65)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn(
                    "w-full h-12 rounded-full px-5 pr-12 text-sm transition-all duration-200 focus:outline-none",
                    errors.password ? "border-2" : "border focus:border-2"
                  )}
                  style={
                    errors.password
                      ? {
                          background: "oklch(0.982 0.006 65)",
                          color: "oklch(0.18 0.01 65)",
                          borderColor: "oklch(0.55 0.20 18)",
                          boxShadow: "0 0 0 3px oklch(0.55 0.20 18 / 0.12)",
                        }
                      : {
                          background: "oklch(0.982 0.006 65)",
                          color: "oklch(0.18 0.01 65)",
                          borderColor: "oklch(0.87 0.008 65)",
                        }
                  }
                  onFocus={(e) => {
                    if (!errors.password) {
                      e.currentTarget.style.borderColor = "oklch(0.55 0.20 18)";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px oklch(0.55 0.20 18 / 0.10)";
                      e.currentTarget.style.borderWidth = "2px";
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.password) {
                      e.currentTarget.style.borderColor = "oklch(0.87 0.008 65)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderWidth = "1px";
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity duration-150 hover:opacity-70"
                  style={{ color: "oklch(0.58 0.010 65)" }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p
                  className="text-[11px] font-mono pl-2"
                  style={{ color: "oklch(0.48 0.18 18)" }}
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div
                className="rounded-2xl px-4 py-3"
                style={{
                  background: "oklch(0.55 0.20 18 / 0.06)",
                  border: "1px solid oklch(0.55 0.20 18 / 0.22)",
                }}
              >
                <p
                  className="text-[12px] font-mono"
                  style={{ color: "oklch(0.42 0.18 18)" }}
                >
                  {serverError}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-full text-[11px] tracking-[0.32em] uppercase font-mono flex items-center justify-center gap-2 mt-1 transition-opacity duration-200 disabled:opacity-55 disabled:cursor-not-allowed hover:opacity-88 active:opacity-75"
              style={{
                background: "oklch(0.55 0.20 18)",
                color: "oklch(0.97 0 0)",
                boxShadow: "0 4px 18px -3px oklch(0.55 0.20 18 / 0.40)",
              }}
            >
              {isSubmitting && <Loader2 size={13} className="animate-spin" />}
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p
          className="text-center text-[10px] font-mono tracking-widest uppercase mt-7"
          style={{ color: "oklch(0.62 0.008 65)" }}
        >
          Restricted Access
        </p>
      </div>
    </div>
  );
}
