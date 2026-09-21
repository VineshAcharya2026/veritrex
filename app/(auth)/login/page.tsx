"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Shield, Users } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { LogoLockup, LogoWordmark } from "@/components/ui/Logo";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { useSession } from "@/lib/auth/client";
import type { Role } from "@/lib/db/types";

const ERROR_MESSAGES: Record<string, string> = {
  PENDING_APPROVAL: "Your account is pending admin approval.",
  ACCOUNT_SUSPENDED: "Your account has been suspended. Contact support.",
  ACCOUNT_FROZEN: "Your account is frozen. Contact support.",
  ACCOUNT_DELETED: "This account no longer exists.",
  CredentialsSignin: "Invalid email or password.",
  "Invalid email or password": "Invalid email or password.",
  "Login failed":
    "Something went wrong on our side. Wait a moment and try again, or reset your password.",
};

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      const code = body.error ?? "Login failed";
      setError(ERROR_MESSAGES[code] || code || "Login failed. Please try again.");
      return;
    }

    const role = body.user?.role;
    const status = body.user?.status;

    await refresh();

    if (status === "PENDING") {
      router.refresh();
      router.push("/pending-approval");
      return;
    }

    await fetch("/api/auth/login-log", { method: "POST", credentials: "include" });

    router.refresh();
    router.push(role ? dashboardPathForRole(role as Role) : "/");
  }

  return (
    <div className="flex min-h-screen auth-bg">
      <div className="hidden flex-1 flex-col justify-between p-12 text-white lg:flex">
        <LogoLockup height={72} rounded="rounded-2xl" shadowed priority />
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            {BRAND.tagline}
          </h1>
          <p className="text-lg text-white/70">{BRAND.description}</p>
          <div className="space-y-4 pt-4">
            {[
              { icon: Users, text: "Structured Mentor-Mentee Marketplace" },
              { icon: Shield, text: "TrustScore Engine with blind bilateral ratings" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-white/80">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4 text-landing-mint" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-white/40">
          © {BRAND.name} · {BRAND.city}
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-surface px-4 py-12 lg:rounded-l-[2rem]">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 lg:hidden">
            <LogoWordmark height={36} priority />
          </div>

          <h2 className="text-2xl font-bold text-primary">Welcome back</h2>
          <p className="mt-1 text-sm text-muted">Sign in to your {BRAND.name} account</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && <Alert variant="error">{error}</Alert>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs font-medium text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" variant="accent" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            No account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
