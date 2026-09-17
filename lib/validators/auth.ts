import { z } from "zod";
import { optionalPhoneSchema } from "@/lib/validators/phone";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80, "Too long")
  .regex(/^[\p{L}\s'.-]+$/u, "Use letters only");

export const registerSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: optionalPhoneSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: z.enum(["MENTOR", "MENTEE"]),
  companyName: z.string().trim().max(120).optional().or(z.literal("")),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  expertise: z.string().trim().max(500).optional().or(z.literal("")),
  currentRole: z.string().trim().max(120).optional().or(z.literal("")),
  goals: z.string().trim().max(2000).optional().or(z.literal("")),
  desiredSkills: z.string().trim().max(500).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const quickStartSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(160, "Too long")
    .regex(/^[\p{L}\s'.-]+$/u, "Use letters only"),
  email: z.string().trim().email("Enter a valid email"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export function mapZodFieldErrors(flatten: {
  fieldErrors?: Record<string, string[] | undefined>;
}): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(flatten.fieldErrors ?? {})) {
    if (msgs?.[0]) next[key] = msgs[0];
  }
  return next;
}
