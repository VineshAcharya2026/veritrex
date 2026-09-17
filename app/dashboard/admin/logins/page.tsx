"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, EmptyState } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Role } from "@/lib/db/types";

type LoginEvent = {
  id: string;
  email: string;
  role: Role;
  ipAddress: string | null;
  createdAt: string;
  user: { profile?: { firstName: string; lastName: string } };
};

export default function AdminLoginsPage() {
  const [logins, setLogins] = useState<LoginEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    fetch(`/api/admin/logins?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setLogins(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [q, role]);

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="User logins" description="All sign-in activity on the platform" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by name or email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-10 rounded-md border border-primary/10 bg-white px-3 text-sm"
        >
          <option value="">All roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="MENTOR">Mentors</option>
          <option value="MENTEE">Mentees</option>
        </select>
        <Button variant="outline" onClick={load}>
          Search
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-primary/5" />
          ))}
        </div>
      ) : logins.length === 0 ? (
        <EmptyState title="No logins recorded" description="Sign-in events will appear here." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-primary/8 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-primary/8 bg-surface text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">IP</th>
                <th className="px-4 py-3 font-semibold">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {logins.map((login) => (
                <tr key={login.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-primary">
                      {login.user.profile
                        ? `${login.user.profile.firstName} ${login.user.profile.lastName}`
                        : login.email}
                    </p>
                    <p className="text-xs text-muted">{login.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted">{login.role.toLowerCase().replace("_", " ")}</td>
                  <td className="px-4 py-3 text-muted">{login.ipAddress ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(login.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
