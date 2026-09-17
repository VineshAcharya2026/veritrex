"use client";

import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RegisterFormValues } from "@/lib/validators/auth";
import { sanitizeName } from "@/lib/validators/register-form";
import { PHONE_INVALID_MSG, sanitizePhoneInput } from "@/lib/validators/phone";

type RegisterFormFieldsProps = {
  register: UseFormRegister<RegisterFormValues>;
  errors: FieldErrors<RegisterFormValues>;
  role: RegisterFormValues["role"];
  setValue: UseFormSetValue<RegisterFormValues>;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600">{message}</p>;
}

export function RegisterFormFields({
  register,
  errors,
  role,
  setValue,
}: RegisterFormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            autoComplete="given-name"
            aria-invalid={Boolean(errors.firstName)}
            {...register("firstName", {
              onChange: (e) => {
                setValue("firstName", sanitizeName(e.target.value), {
                  shouldValidate: true,
                });
              },
            })}
          />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            autoComplete="family-name"
            aria-invalid={Boolean(errors.lastName)}
            {...register("lastName", {
              onChange: (e) => {
                setValue("lastName", sanitizeName(e.target.value), {
                  shouldValidate: true,
                });
              },
            })}
          />
          <FieldError message={errors.lastName?.message} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          title={PHONE_INVALID_MSG}
          aria-invalid={Boolean(errors.phone)}
          {...register("phone", {
            onChange: (e) => {
              setValue("phone", sanitizePhoneInput(e.target.value), {
                shouldValidate: true,
              });
            },
          })}
        />
        <FieldError message={errors.phone?.message} />
      </div>

      {role === "MENTOR" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company</Label>
            <Input
              id="companyName"
              aria-invalid={Boolean(errors.companyName)}
              {...register("companyName")}
            />
            <FieldError message={errors.companyName?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              aria-invalid={Boolean(errors.title)}
              {...register("title")}
            />
            <FieldError message={errors.title?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expertise">Expertise (comma-separated)</Label>
            <Input
              id="expertise"
              placeholder="React, Leadership"
              aria-invalid={Boolean(errors.expertise)}
              {...register("expertise")}
            />
            <FieldError message={errors.expertise?.message} />
          </div>
        </>
      )}

      {role === "MENTEE" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="currentRole">Current role</Label>
            <Input
              id="currentRole"
              aria-invalid={Boolean(errors.currentRole)}
              {...register("currentRole")}
            />
            <FieldError message={errors.currentRole?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goals">Goals</Label>
            <Input
              id="goals"
              aria-invalid={Boolean(errors.goals)}
              {...register("goals")}
            />
            <FieldError message={errors.goals?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desiredSkills">Desired skills (comma-separated)</Label>
            <Input
              id="desiredSkills"
              placeholder="TypeScript, System Design"
              aria-invalid={Boolean(errors.desiredSkills)}
              {...register("desiredSkills")}
            />
            <FieldError message={errors.desiredSkills?.message} />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>
    </>
  );
}
