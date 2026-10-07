import { NextResponse } from "next/server";
import type { Role } from "@/lib/db/types";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreMentorMatch } from "@/lib/mentor-matching";
import { scoreMenteeMatch } from "@/lib/mentee-matching";
import { scoreCrossMemberMatch } from "@/lib/cross-member-matching";

export type DiscoveredUser = {
  userId: string;
  role: Role;
  profile?: { firstName: string; lastName: string; avatar: string | null } | null;
  company?: string | null;
  title?: string | null;
  expertise?: string[];
  city?: string | null;
  industry?: string | null;
  linkedInUrl?: string | null;
  isEliteFounder100?: boolean;
  currentDesignation?: string | null;
  currentRole?: string | null;
  preferredIndustry?: string | null;
  guidanceAreas?: string[];
};

type MatchRow = { score: number; reasons: string[]; user: DiscoveredUser };

const FALLBACK_REASON = "Complete your profile for better matches";

function mentorToDiscovered(
  other: {
    userId: string;
    company: string | null;
    title: string | null;
    expertise: string[];
    city: string | null;
    industry: string | null;
    linkedInUrl: string | null;
    isEliteFounder100: boolean;
    user: {
      profile: { firstName: string; lastName: string; avatar: string | null } | null;
    };
  }
): DiscoveredUser {
  return {
    userId: other.userId,
    role: "MENTOR",
    profile: other.user.profile,
    company: other.company,
    title: other.title,
    expertise: other.expertise,
    city: other.city,
    industry: other.industry,
    linkedInUrl: other.linkedInUrl,
    isEliteFounder100: other.isEliteFounder100,
  };
}

function menteeToDiscovered(
  other: {
    userId: string;
    currentDesignation: string | null;
    currentRole: string | null;
    preferredIndustry: string | null;
    city: string | null;
    guidanceAreas: string[];
    user: {
      profile: { firstName: string; lastName: string; avatar: string | null } | null;
    };
  }
): DiscoveredUser {
  return {
    userId: other.userId,
    role: "MENTEE",
    profile: other.user.profile,
    currentDesignation: other.currentDesignation,
    currentRole: other.currentRole,
    preferredIndustry: other.preferredIndustry,
    city: other.city,
    guidanceAreas: other.guidanceAreas,
  };
}

export async function GET() {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const viewerId = session.user.id;

  const [mentorSelf, menteeSelf] = await Promise.all([
    prisma.mentorProfile.findUnique({
      where: { userId: viewerId },
      include: {
        skills: true,
        user: { include: { profile: true, memberReflection: true } },
      },
    }),
    prisma.menteeProfile.findUnique({
      where: { userId: viewerId },
      include: { user: { include: { profile: true } } },
    }),
  ]);

  if (!mentorSelf && !menteeSelf) {
    return NextResponse.json({
      matches: [],
      error: "Complete your profile first",
    });
  }

  const [mentors, mentees] = await Promise.all([
    prisma.mentorProfile.findMany({
      where: { userId: { not: viewerId }, user: { status: "ACTIVE" } },
      include: {
        skills: true,
        user: { include: { profile: true, memberReflection: true } },
      },
      take: 80,
    }),
    prisma.menteeProfile.findMany({
      where: { userId: { not: viewerId }, user: { status: "ACTIVE" } },
      include: { user: { include: { profile: true } } },
      take: 80,
    }),
  ]);

  const byUserId = new Map<string, MatchRow>();

  function upsert(row: MatchRow) {
    const prev = byUserId.get(row.user.userId);
    if (!prev || row.score > prev.score) {
      byUserId.set(row.user.userId, row);
    }
  }

  if (mentorSelf) {
    const selfInput = {
      id: mentorSelf.id,
      userId: mentorSelf.userId,
      company: mentorSelf.company,
      title: mentorSelf.title,
      expertise: mentorSelf.expertise,
      city: mentorSelf.city,
      industry: mentorSelf.industry,
      seniorityLevel: mentorSelf.seniorityLevel,
      interests: mentorSelf.interests,
      skills: mentorSelf.skills,
      profile: mentorSelf.user.profile,
      reflection: mentorSelf.user.memberReflection
        ? {
            valuedQualities: mentorSelf.user.memberReflection.valuedQualities,
            sharingTopics: mentorSelf.user.memberReflection.sharingTopics,
          }
        : null,
    };

    for (const other of mentors) {
      const { score, reasons } = scoreMentorMatch(selfInput, {
        id: other.id,
        userId: other.userId,
        company: other.company,
        title: other.title,
        expertise: other.expertise,
        city: other.city,
        industry: other.industry,
        seniorityLevel: other.seniorityLevel,
        interests: other.interests,
        skills: other.skills,
        profile: other.user.profile,
        reflection: other.user.memberReflection
          ? {
              valuedQualities: other.user.memberReflection.valuedQualities,
              sharingTopics: other.user.memberReflection.sharingTopics,
            }
          : null,
      });
      upsert({ score, reasons, user: mentorToDiscovered(other) });
    }

    for (const other of mentees) {
      const { score, reasons } = scoreCrossMemberMatch(
        {
          industry: mentorSelf.industry,
          city: mentorSelf.city,
          expertise: mentorSelf.expertise,
        },
        {
          preferredIndustry: other.preferredIndustry,
          city: other.city,
          guidanceAreas: other.guidanceAreas,
          languages: other.languages,
        }
      );
      upsert({ score, reasons, user: menteeToDiscovered(other) });
    }
  }

  if (menteeSelf) {
    const selfInput = {
      userId: menteeSelf.userId,
      country: menteeSelf.country,
      city: menteeSelf.city,
      currentStatus: menteeSelf.currentStatus,
      preferredIndustry: menteeSelf.preferredIndustry,
      guidanceAreas: menteeSelf.guidanceAreas,
      skillsToDevelo: menteeSelf.skillsToDevelo,
      preferredModes: menteeSelf.preferredModes,
      languages: menteeSelf.languages,
      profile: menteeSelf.user.profile,
    };

    for (const other of mentees) {
      const { score, reasons } = scoreMenteeMatch(selfInput, {
        userId: other.userId,
        country: other.country,
        city: other.city,
        currentStatus: other.currentStatus,
        preferredIndustry: other.preferredIndustry,
        guidanceAreas: other.guidanceAreas,
        skillsToDevelo: other.skillsToDevelo,
        preferredModes: other.preferredModes,
        languages: other.languages,
        profile: other.user.profile,
      });
      upsert({ score, reasons, user: menteeToDiscovered(other) });
    }

    if (mentorSelf) {
      for (const other of mentors) {
        const { score, reasons } = scoreCrossMemberMatch(
          {
            industry: other.industry,
            city: other.city,
            expertise: other.expertise,
          },
          {
            preferredIndustry: menteeSelf.preferredIndustry,
            city: menteeSelf.city,
            guidanceAreas: menteeSelf.guidanceAreas,
            languages: menteeSelf.languages,
          }
        );
        upsert({ score, reasons, user: mentorToDiscovered(other) });
      }
    } else {
      for (const other of mentors) {
        const { score, reasons } = scoreCrossMemberMatch(
          {
            industry: other.industry,
            city: other.city,
            expertise: other.expertise,
          },
          {
            preferredIndustry: menteeSelf.preferredIndustry,
            city: menteeSelf.city,
            guidanceAreas: menteeSelf.guidanceAreas,
            languages: menteeSelf.languages,
          }
        );
        upsert({ score, reasons, user: mentorToDiscovered(other) });
      }
    }
  }

  let matches = [...byUserId.values()]
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  if (matches.length === 0) {
    const fallbackUsers = await prisma.user.findMany({
      where: { status: "ACTIVE", id: { not: viewerId } },
      include: {
        profile: true,
        mentorProfile: true,
        menteeProfile: true,
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    matches = fallbackUsers
      .filter((u) => u.profile && (u.mentorProfile || u.menteeProfile))
      .slice(0, 20)
      .map((u) => {
        if (u.mentorProfile) {
          return {
            score: 0,
            reasons: [FALLBACK_REASON],
            user: mentorToDiscovered({
              ...u.mentorProfile,
              user: { profile: u.profile },
            }),
          };
        }
        return {
          score: 0,
          reasons: [FALLBACK_REASON],
          user: menteeToDiscovered({
            ...u.menteeProfile!,
            user: { profile: u.profile },
          }),
        };
      });
  }

  return NextResponse.json({ matches });
}
