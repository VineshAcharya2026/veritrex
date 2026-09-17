import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SocialRoleShell } from "@/components/layout/SocialRoleShell";

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "MENTOR" && session.user.role !== "MENTEE") {
    redirect("/dashboard/admin");
  }
  return (
    <SocialRoleShell role={session.user.role as "MENTOR" | "MENTEE"}>
      {children}
    </SocialRoleShell>
  );
}
