import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const strikes = await prisma.reliabilityStrike.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: ninetyDaysAgo } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  const flagged = strikes.filter((s) => s._count.id >= 3);

  const enriched = await Promise.all(
    flagged.map(async (s) => {
      const user = await prisma.user.findUnique({
        where: { id: s.userId },
        include: {
          profile: { select: { firstName: true, lastName: true } },
        },
      });

      const recentStrikes = await prisma.reliabilityStrike.findMany({
        where: { userId: s.userId, createdAt: { gte: ninetyDaysAgo } },
        orderBy: { createdAt: "desc" },
        select: { reason: true, createdAt: true },
      });

      return {
        userId: s.userId,
        name: user?.profile
          ? `${user.profile.firstName} ${user.profile.lastName}`
          : user?.email ?? "Unknown",
        role: user?.role,
        strikeCount: s._count.id,
        strikes: recentStrikes,
      };
    })
  );

  return NextResponse.json(enriched);
}
