"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

export default function MenteeGoalsPage() {
  const [form, setForm] = useState({ currentRole: "", goals: "", desiredSkills: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/mentee/profile")
      .then((r) => r.json())
      .then((p) => {
        if (p?.id) {
          setForm({
            currentRole: p.currentRole || "",
            goals: p.goals || "",
            desiredSkills: (p.desiredSkills || []).join(", "),
          });
        }
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/mentee/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Goals & skills" description="Tell mentors what you want to achieve." />
      {saved && <Alert variant="success">Goals saved.</Alert>}
      <form onSubmit={save} className="space-y-4 rounded-xl border border-primary/8 bg-white p-6 shadow-card">
        <div className="space-y-2">
          <Label>Current role</Label>
          <Input value={form.currentRole} onChange={(e) => setForm({ ...form, currentRole: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Career goals</Label>
          <textarea
            className="flex min-h-28 w-full rounded-md border border-primary/15 px-3 py-2 text-sm"
            value={form.goals}
            onChange={(e) => setForm({ ...form, goals: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Desired skills (comma-separated)</Label>
          <Input
            value={form.desiredSkills}
            onChange={(e) => setForm({ ...form, desiredSkills: e.target.value })}
            placeholder="React, Node.js, Interview prep"
          />
        </div>
        <Button type="submit" variant="accent">
          Save goals
        </Button>
      </form>
    </div>
  );
}
