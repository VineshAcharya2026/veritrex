// Dashboard routes are authenticated and read per-request session state, so they
// must be rendered dynamically rather than statically prerendered at build time.
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
