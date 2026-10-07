"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MENTORSHIP_REQUEST_NOTE,
  MENTORSHIP_REQUEST_QUESTIONS,
  type MentorshipRequestField,
} from "@/lib/mentorship-request-form";
import { formatApiError } from "@/lib/api-errors";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorId: string | null;
  mentorName?: string;
  onSuccess: (mentorId: string) => void;
};

function emptyValues(): Record<string, string | string[]> {
  const v: Record<string, string | string[]> = {};
  for (const q of MENTORSHIP_REQUEST_QUESTIONS) {
    for (const f of q.fields) {
      v[f.id] = f.type === "multiselect" ? [] : "";
    }
  }
  return v;
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: MentorshipRequestField;
  value: string | string[];
  onChange: (next: string | string[]) => void;
}) {
  const id = `req-${field.id}`;

  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {(field.options ?? []).map((o) => {
          const checked = selected.includes(o.value);
          return (
            <label
              key={o.value}
              className="flex cursor-pointer items-start gap-2 rounded-md border border-input px-3 py-2 text-sm has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5"
            >
              <input
                type="checkbox"
                className="mt-0.5"
                checked={checked}
                onChange={() => {
                  const next = checked
                    ? selected.filter((x) => x !== o.value)
                    : [...selected, o.value];
                  onChange(next);
                }}
              />
              <span>{o.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <select
        id={id}
        required={field.required}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {(field.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        id={id}
        required={field.required}
        maxLength={field.maxLength}
        rows={4}
        placeholder={field.placeholder}
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  const inputType =
    field.type === "url" ? "url" : field.type === "date" ? "date" : "text";

  return (
    <Input
      id={id}
      type={inputType}
      required={field.required}
      maxLength={field.maxLength}
      placeholder={field.placeholder}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function MentorshipRequestDialog({
  open,
  onOpenChange,
  mentorId,
  mentorName,
  onSuccess,
}: Props) {
  const [values, setValues] = useState<Record<string, string | string[]>>(emptyValues);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setValues(emptyValues());
    setError("");
  }

  function validateClient(): string | null {
    for (const q of MENTORSHIP_REQUEST_QUESTIONS) {
      for (const f of q.fields) {
        const v = values[f.id];
        if (f.type === "multiselect") {
          const arr = Array.isArray(v) ? v : [];
          const min = f.minSelected ?? (f.required ? 1 : 0);
          if (min > 0 && arr.length < min) {
            return `${f.label ?? f.id}: select at least ${min} option(s).`;
          }
        } else if (f.required) {
          const s = typeof v === "string" ? v.trim() : "";
          if (!s) return `${f.label ?? f.id} is required.`;
        }
      }
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mentorId) return;

    const clientErr = validateClient();
    if (clientErr) {
      setError(clientErr);
      return;
    }

    setLoading(true);
    setError("");

    const requestAnswers: Record<string, string | string[]> = {};
    for (const q of MENTORSHIP_REQUEST_QUESTIONS) {
      for (const f of q.fields) {
        const v = values[f.id];
        if (f.type === "multiselect") {
          requestAnswers[f.id] = Array.isArray(v) ? v : [];
        } else {
          requestAnswers[f.id] = typeof v === "string" ? v.trim() : "";
        }
      }
    }

    const res = await fetch("/api/mentee/mentorships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mentorId, requestAnswers }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(formatApiError(data.error, "Request failed"));
      return;
    }

    resetForm();
    onOpenChange(false);
    onSuccess(mentorId);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Request mentorship</DialogTitle>
            <DialogDescription>
              {mentorName
                ? `Tell ${mentorName} what you need so they can decide if it’s a good fit.`
                : "Share your training requirements with this mentor."}
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-6">
            {MENTORSHIP_REQUEST_QUESTIONS.map((q, qi) => (
              <section
                key={q.id}
                className="space-y-3 rounded-lg border border-primary/10 bg-surface/30 p-4"
              >
                <p className="text-sm font-medium text-primary">
                  {qi + 1}. {q.label}
                </p>
                {q.helpText && (
                  <p className="text-xs text-muted">{q.helpText}</p>
                )}
                {q.fields.map((f) => (
                  <div key={f.id} className="space-y-1.5">
                    {f.label && (
                      <Label htmlFor={`req-${f.id}`}>
                        {f.label}
                        {f.required ? " *" : ""}
                      </Label>
                    )}
                    <FieldInput
                      field={f}
                      value={values[f.id] ?? (f.type === "multiselect" ? [] : "")}
                      onChange={(next) =>
                        setValues((prev) => ({ ...prev, [f.id]: next }))
                      }
                    />
                  </div>
                ))}
              </section>
            ))}

            <p className="text-xs text-muted">{MENTORSHIP_REQUEST_NOTE}</p>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={loading || !mentorId}>
              {loading ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
