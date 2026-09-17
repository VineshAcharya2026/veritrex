"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { compressImageForUpload } from "@/lib/image-compress";

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AvatarImageUploader({ displayName }: { displayName?: string }) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile/avatar")
      .then((r) => r.json())
      .then((d) => setAvatar(d.avatar ?? null))
      .catch(() => {});
  }, []);

  async function save(url: string | null) {
    const res = await fetch("/api/profile/avatar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar: url }),
    });
    if (!res.ok) {
      setError("Failed to save profile photo");
      return;
    }
    setAvatar(url);
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
      <Label>Profile photo</Label>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/10 bg-primary/5 text-lg font-semibold text-primary">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(displayName)
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Camera className="mr-1 h-3.5 w-3.5" />
            {uploading ? "Uploading…" : avatar ? "Change photo" : "Upload photo"}
          </Button>
          {avatar && (
            <Button type="button" size="sm" variant="outline" onClick={() => save(null)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
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
        Required for verified endorsements. Shown on your profile and feed posts.
      </p>
    </div>
  );
}
