import type { RegisterFormValues } from "@/lib/validators/auth";

const NAME_RE = /^[\p{L}\s'.-]*$/u;

export function sanitizeName(raw: string): string {
  return raw.replace(/[^\p{L}\s'.-]/gu, "");
}

export function isValidNameInput(raw: string): boolean {
  const trimmed = raw.trim();
  return trimmed.length > 0 && NAME_RE.test(trimmed);
}

export const REGISTER_DEFAULT_VALUES: RegisterFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  role: "MENTEE",
  companyName: "",
  title: "",
  expertise: "",
  currentRole: "",
  goals: "",
  desiredSkills: "",
};
