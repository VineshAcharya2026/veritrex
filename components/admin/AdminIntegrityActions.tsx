"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function AdminIntegrityActions() {
  const [busy, setBusy] = useState<"recalc" | "cron" | null>(null);
  const [message, setMessage] = useState("");

  async function recalculate() {
    setBusy("recalc");
    setMessage("");
    try {
      const res = await fetch("/api/admin/recalculate-trust-scores", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Recalculate failed");
        return;
      }
      setMessage(`TrustScores recalculated for ${data.processed ?? 0} users.`);
    } finally {
      setBusy(null);
    }
  }

  async function runCron() {
    setBusy("cron");
    setMessage("");
    try {
      const res = await fetch("/api/admin/run-cron", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Cron jobs failed");
        return;
      }
      setMessage(
        `Integrity jobs done — unilateral: ${data.unilateralUpdated}, trust: ${data.trustScoresProcessed}, cheat flags: ${data.cheatFlagsCreated}.`
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="accent"
          disabled={busy !== null}
          onClick={recalculate}
        >
          {busy === "recalc" ? "Recalculating…" : "Recalculate TrustScores"}
        </Button>
        <Button
          variant="outline"
          disabled={busy !== null}
          onClick={runCron}
        >
          {busy === "cron" ? "Running…" : "Run integrity jobs"}
        </Button>
      </div>
      {message && <Alert variant="info">{message}</Alert>}
    </div>
  );
}
