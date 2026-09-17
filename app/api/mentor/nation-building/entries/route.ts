import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_IMPACT_STORIES } from "@/lib/nation-building";

const CATEGORY_VALUES = [
  "FREE_MENTORING",
  "UNDERPRIVILEGED_MENTEES",
  "CAREER_GROWTH",
  "JOBS_REFERRALS",
  "STARTUP_SUCCESS",
  "GROUP_MENTORING",
  "MASTERCLASSES",
  "COMMUNITY_SERVICE",
  "VOLUNTEER_HOURS",
  "IMPACT_STORY",
] as const;

const entrySchema = z.object({
  category: z.enum(CATEGORY_VALUES),
  title: z.string().min(2).max(160),
  description: z.string().max(4000).optional(),
  quantity: z.number().int().min(0).max(100000).optional(),
  eventDate: z.string().optional(),
  location: z.string().max(160).optional(),
  testimonial: z.string().max(4000).optional(),
  evidenceUrls: z.array(z.string()).max(10).optional(),
});

export async function POST(request: Request) {
  const { error, session } = await requireRole("MENTOR");
  if (error || !session) return error;

  const body = await request.json();
  const parsed = entrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  if (data.category === "IMPACT_STORY") {
    const storyCount = await prisma.nationBuildingEntry.count({
      where: { mentorId: session.user.id, category: "IMPACT_STORY" },
    });
    if (storyCount >= MAX_IMPACT_STORIES) {
      return NextResponse.json(
        { error: `You can add up to ${MAX_IMPACT_STORIES} impact stories.` },
        { status: 400 }
      );
    }
  }

  const entry = await prisma.nationBuildingEntry.create({
    data: {
      mentorId: session.user.id,
      category: data.category,
      title: data.title,
      description: data.description ?? null,
      quantity: data.quantity ?? 0,
      eventDate: data.eventDate ? new Date(data.eventDate) : null,
      location: data.location ?? null,
      testimonial: data.testimonial ?? null,
      evidenceUrls: data.evidenceUrls ?? [],
      source: "MANUAL",
      verified: false,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
