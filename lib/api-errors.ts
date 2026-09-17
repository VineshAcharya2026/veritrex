/** Turn API error payloads (strings or Zod flatten objects) into user-readable text. */
export function formatApiError(error: unknown, fallback: string): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "formErrors" in error) {
    const f = error as {
      formErrors?: string[];
      fieldErrors?: Record<string, string[]>;
    };
    const parts = [
      ...(f.formErrors ?? []),
      ...Object.entries(f.fieldErrors ?? {}).flatMap(([k, v]) =>
        (v ?? []).map((m) => `${k}: ${m}`)
      ),
    ];
    if (parts.length) return parts.join("; ");
  }
  return fallback;
}

export function zodErrorMessage(flatten: {
  formErrors?: string[];
  fieldErrors?: Record<string, string[]>;
}): string {
  return formatApiError(flatten, "Invalid request");
}
