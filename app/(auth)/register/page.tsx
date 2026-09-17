"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { LogoWordmark } from "@/components/ui/Logo";
import { BRAND } from "@/lib/brand";
import { RegisterFormFields } from "@/components/auth/RegisterFormFields";
import { formatApiError } from "@/lib/api-errors";
import {
  mapZodFieldErrors,
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validators/auth";
import { formatPhoneForApi } from "@/lib/validators/phone";
import { REGISTER_DEFAULT_VALUES } from "@/lib/validators/register-form";

type RegisterRole = RegisterFormValues["role"];

const ROLES: { id: RegisterRole; label: string }[] = [
  { id: "MENTOR", label: "Mentor" },
  { id: "MENTEE", label: "Mentee" },
];

function parseRoleParam(value: string | null): RegisterRole {
  if (value === "MENTOR" || value === "MENTEE") return value;
  return "MENTEE";
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen auth-bg items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError: setFieldError,
    watch,
    reset,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: REGISTER_DEFAULT_VALUES,
  });

  const role = watch("role");

  useEffect(() => {
    reset({
      ...REGISTER_DEFAULT_VALUES,
      role: parseRoleParam(searchParams.get("role")),
      firstName: searchParams.get("firstName")?.trim() || "",
      lastName: searchParams.get("lastName")?.trim() || "",
      email: searchParams.get("email")?.trim() || "",
    });
  }, [searchParams, reset]);

  async function onSubmit(values: RegisterFormValues) {
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        phone: formatPhoneForApi(values.phone),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      const fieldErrorsFromApi = data.error?.fieldErrors as
        | Record<string, string[] | undefined>
        | undefined;
      if (fieldErrorsFromApi) {
        const mapped = mapZodFieldErrors({ fieldErrors: fieldErrorsFromApi });
        for (const [key, message] of Object.entries(mapped)) {
          setFieldError(key as keyof RegisterFormValues, { message });
        }
        if (Object.keys(mapped).length) return;
      }
      setError(formatApiError(data.error, "Registration failed"));
      return;
    }

    router.push("/login");
  }

  return (
    <div className="flex min-h-screen auth-bg items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl animate-fade-in">
        <div className="h-1.5 bg-gradient-to-r from-landing-teal via-landing-gold to-landing-teal" />
        <div className="p-8">
          <LogoWordmark height={36} className="mb-4" priority />
          <h2 className="text-2xl font-bold text-primary">Create your account</h2>
          <p className="mt-1 text-sm text-muted">Join {BRAND.name} as a mentor or mentee</p>

          <div className="mb-6 mt-6 grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() =>
                  setValue("role", r.id, { shouldValidate: true, shouldTouch: true })
                }
                className={cn(
                  "rounded-md border px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  role === r.id
                    ? "border-primary bg-primary text-white shadow-card"
                    : "border-primary/15 bg-white text-muted hover:border-primary/30"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {error && <Alert variant="error">{error}</Alert>}
            <RegisterFormFields
              register={register}
              errors={errors}
              role={role}
              setValue={setValue}
            />
            <Button type="submit" className="w-full" variant="accent" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
