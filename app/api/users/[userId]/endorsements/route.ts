import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { countVerifiedEndorsements } from "@/lib/endorsements";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const count = await countVerifiedEndorsements(userId);

  return NextResponse.json({ count });
}
