"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { NATION_BUILDING_CATEGORIES } from "@/lib/nation-building";
import type { NationBuildingCategory } from "@/lib/db/types";

const UNIT_LABEL: Record<string, string> = {
  sessions: "Number of sessions",
  people: "Number of people",
  hours: "Number of hours",
  count: "Quantity",
};

export function ContributionForm({
  category,
  onSaved,
  onCancel,
}: {
  category: NationBuildingCategory;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const meta = NATION_BUILDING_CATEGORIES.find((c) => c.category === category)!;
  const isStory = category === "IMPACT_STORY";

  const [form, setForm] = useState({
    title: "",
    description: "",
    quantity: isStory ? "1" : "",
    location: "",
    eventDate: "",
    testimonial: "",
  });
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/mentor/nation-building/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      setEvidenceUrls((prev) => [...prev, data.fileUrl]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.title.trim().length < 2) {
      setError("Please add a short title.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/mentor/nation-building/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          quantity: form.quantity ? Number(form.quantity) : 0,
          location: form.location.trim() || undefined,
          eventDate: form.eventDate || undefined,
          testimonial: form.testimonial.trim() || undefined,
          evidenceUrls,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to save contribution");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-primary/10 bg-primary/[0.02] p-4">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder={meta.description}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{UNIT_LABEL[meta.unit]}</Label>
          <Input
            type="number"
            min={0}
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={form.eventDate}
            onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Location (optional)</Label>
        <Input
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      {isStory && (
        <div className="space-y-2">
          <Label>Testimonial (optional)</Label>
          <Textarea
            rows={2}
            value={form.testimonial}
            onChange={(e) => setForm({ ...form, testimonial: e.target.value })}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Evidence (photos or PDF, optional)</Label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleUpload}
          disabled={uploading}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-sm file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:text-primary"
        />
        {evidenceUrls.length > 0 && (
          <p className="text-xs text-success">{evidenceUrls.length} file(s) attached.</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="accent" disabled={saving || uploading}>
          {saving ? "Saving…" : "Submit for verification"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
