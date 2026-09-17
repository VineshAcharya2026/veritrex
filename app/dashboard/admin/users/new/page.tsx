"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RegisterFormFields } from "@/components/auth/RegisterFormFields";
import { formatApiError } from "@/lib/api-errors";
import {
  mapZodFieldErrors,
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validators/auth";
import { formatPhoneForApi } from "@/lib/validators/phone";
import { REGISTER_DEFAULT_VALUES } from "@/lib/validators/register-form";

type CreateRole = RegisterFormValues["role"];

export default function AdminCreateUserPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError: setFieldError,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: REGISTER_DEFAULT_VALUES,
  });

  const role = watch("role");

  async function onSubmit(values: RegisterFormValues) {
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/users", {
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
      setError(formatApiError(data.error, "Failed to create user"));
      return;
    }

    router.push(`/dashboard/admin/users/${data.id}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add user"
        description="Create a mentor or mentee account."
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/admin/users">Cancel</Link>
          </Button>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="max-w-xl space-y-4 rounded-xl border border-primary/8 bg-white p-6 shadow-card"
      >
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            value={role}
            onChange={(e) =>
              setValue("role", e.target.value as CreateRole, {
                shouldValidate: true,
                shouldTouch: true,
              })
            }
            className="h-10 w-full rounded-md border border-primary/10 bg-white px-3 text-sm"
          >
            <option value="MENTOR">Mentor</option>
            <option value="MENTEE">Mentee</option>
          </select>
        </div>

        <RegisterFormFields
          register={register}
          errors={errors}
          role={role}
          setValue={setValue}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create user"}
        </Button>
      </form>
    </div>
  );
}
