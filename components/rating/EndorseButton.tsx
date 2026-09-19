"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp } from "lucide-react";

import { formatApiError } from "@/lib/api-errors";

export function EndorseButton({
  userId,
  initialCount,
  initialEndorsed = false,
  viewerHasAvatar = true,
}: {
  userId: string;
  initialCount: number;
  initialEndorsed?: boolean;
  viewerHasAvatar?: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [endorsed, setEndorsed] = useState(initialEndorsed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCount(initialCount);
    setEndorsed(initialEndorsed);
  }, [initialCount, initialEndorsed]);

  async function toggle() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/users/${userId}/endorse`, {
      method: endorsed ? "DELETE" : "POST",
      credentials: "include",
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(formatApiError(data.error, "Failed to update endorsement"));
      return;
    }
    setEndorsed(!endorsed);
    setCount((c) => (endorsed ? Math.max(0, c - 1) : c + 1));
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={endorsed ? "accent" : "outline"}
          size="sm"
          onClick={toggle}
          disabled={loading || !viewerHasAvatar}
          title={!viewerHasAvatar ? "Upload a profile photo to endorse others" : undefined}
        >
          <ThumbsUp className="mr-1.5 h-4 w-4" />
          {endorsed ? "Endorsed" : "Endorse"}
        </Button>
        <span className="text-sm text-muted">
          {count} verified endorsement{count !== 1 ? "s" : ""}
        </span>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!viewerHasAvatar && (
        <p className="text-xs text-muted">
          Upload a profile photo on your profile page to endorse others.
        </p>
      )}
    </div>
  );
}
