"use client";

import { useRef, useState } from "react";
import { ImageIcon, Mic, Video, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { compressImageForUpload } from "@/lib/image-compress";
import type { FeedPostItem } from "./types";

const TYPES = [
  { value: "POST", label: "Post", icon: FileText, accept: "" },
  { value: "IMAGE", label: "Photo", icon: ImageIcon, accept: "image/jpeg,image/png,image/webp,image/gif" },
  { value: "VIDEO", label: "Video", icon: Video, accept: "video/mp4,video/webm,video/quicktime" },
  { value: "PODCAST", label: "Podcast", icon: Mic, accept: "audio/mpeg,audio/mp4,audio/wav,audio/ogg,video/mp4,video/webm,video/quicktime" },
] as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Derive a display title from body text or media filename (LinkedIn-style single composer). */
function deriveTitle(body: string, file: File | null, type: string): string {
  const firstLine = body
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find(Boolean);
  if (firstLine) return firstLine.slice(0, 200);

  if (file?.name) {
    const base = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
    if (base) return base.slice(0, 200);
  }

  if (type === "IMAGE") return "Photo";
  if (type === "VIDEO") return "Video";
  if (type === "PODCAST") return "Podcast";
  return "Update";
}

export function FeedComposer({
  onCreated,
  authorName,
  authorAvatar,
}: {
  onCreated: (post: FeedPostItem) => void;
  authorName?: string;
  authorAvatar?: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>("POST");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const needsMedia = type === "IMAGE" || type === "VIDEO" || type === "PODCAST";
  const accept = TYPES.find((t) => t.value === type)?.accept ?? "";

  function reset() {
    setBody("");
    setFile(null);
    setType("POST");
    setError("");
    setExpanded(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (needsMedia && !file) {
      setError("Please attach a media file");
      return;
    }
    if (!needsMedia && !body.trim() && !file) {
      setError("Add some text or an attachment");
      return;
    }

    const title = deriveTitle(body, file, type);

    setSubmitting(true);
    try {
      let mediaUrl: string | undefined;
      let storageKey: string | undefined;
      let mimeType: string | undefined;
      let fileSize: number | undefined;

      if (file) {
        const uploadFile =
          type === "IMAGE" || file.type.startsWith("image/")
            ? await compressImageForUpload(file)
            : file;
        const fd = new FormData();
        fd.append("file", uploadFile);
        const up = await fetch("/api/feed/upload", { method: "POST", body: fd });
        const upData = await up.json();
        if (!up.ok) {
          setError(typeof upData.error === "string" ? upData.error : "Upload failed");
          return;
        }
        mediaUrl = upData.fileUrl;
        storageKey = upData.storageKey;
        mimeType = upData.mimeType;
        fileSize = upData.fileSize;
      }

      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          body: body.trim() || undefined,
          mediaUrl,
          storageKey,
          mimeType,
          fileSize,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : data.error?.message || "Failed to publish"
        );
        return;
      }
      onCreated(data as FeedPostItem);
      reset();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!expanded) {
    return (
      <div className="rounded-xl border border-primary/8 bg-white p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {authorAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={authorAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(authorName || "You")
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex-1 rounded-full border border-primary/15 bg-primary/[0.03] px-4 py-3 text-left text-sm text-muted transition-colors hover:bg-primary/[0.06]"
          >
            Start a post
          </button>
        </div>
        <div className="mt-3 flex flex-wrap justify-around gap-1 border-t border-primary/5 pt-3">
          {TYPES.slice(1).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setType(t.value);
                  setExpanded(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:bg-primary/5 hover:text-primary"
              >
                <Icon className="h-4 w-4 text-accent" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-xl border border-primary/8 bg-white p-5 shadow-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {authorAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={authorAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(authorName || "You")
            )}
          </div>
          <div>
            <p className="font-semibold text-primary">{authorName || "You"}</p>
            <p className="text-xs text-muted">Share with the community</p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-full p-1.5 text-muted hover:bg-primary/5"
          aria-label="Close composer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setType(t.value);
                setFile(null);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                type === t.value
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-primary/10 text-muted hover:border-accent/30"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What do you want to talk about?"
        rows={4}
        maxLength={5000}
        className="resize-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
        autoFocus
      />

      {(needsMedia || type === "POST") && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept={accept || undefined}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-sm file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:text-primary"
          />
          {file && (
            <p className="mt-1 text-xs text-muted">
              {file.name} ({Math.round(file.size / 1024)} KB)
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-primary/5 pt-3">
        <Button type="button" variant="outline" onClick={reset}>
          Cancel
        </Button>
        <Button type="submit" variant="accent" disabled={submitting}>
          {submitting ? "Publishing..." : "Post"}
        </Button>
      </div>
    </form>
  );
}
