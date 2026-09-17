"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { compressImageForUpload } from "@/lib/image-compress";

export function CoverImageUploader() {
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile/cover")
      .then((r) => r.json())
      .then((d) => setCoverImage(d.coverImage ?? null))
      .catch(() => {});
  }, []);

  async function save(url: string | null) {
    const res = await fetch("/api/profile/cover", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverImage: url }),
    });
    if (!res.ok) {
      setError("Failed to save cover image");
      return;
    }
    setCoverImage(url);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const uploadFile = await compressImageForUpload(file);
      const fd = new FormData();
      fd.append("file", uploadFile);
      const up = await fetch("/api/feed/upload", { method: "POST", body: fd });
      const data = await up.json();
      if (!up.ok) {
        setError(typeof data.error === "string" ? data.error : "Upload failed");
        return;
      }
      await save(data.fileUrl);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label>Cover photo</Label>
      <div className="overflow-hidden rounded-lg border border-primary/10">
        <div
          className="relative flex h-28 items-end justify-end bg-gradient-to-r from-landing-navy via-landing-teal/80 to-landing-gold/50 p-2"
          style={
            coverImage
              ? {
                  backgroundImage: `url(${coverImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <ImageIcon className="mr-1 h-3.5 w-3.5" />
              {uploading ? "Uploading…" : coverImage ? "Change" : "Upload"}
            </Button>
            {coverImage && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => save(null)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFile}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-muted">
        Shown on your public profile and feed card. Recommended 1200×300.
      </p>
    </div>
  );
}
