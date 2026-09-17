import type { SeniorityLevel } from "@/lib/db/types";

type MentorMatchInput = {
  id: string;
  userId: string;
  company: string | null;
  title: string | null;
  expertise: string[];
  city: string | null;
  industry: string | null;
  seniorityLevel: SeniorityLevel | null;
  interests: string[];
  skills: { skill: string; masteryLevel: number }[];
  profile?: { firstName: string; lastName: string; avatar: string | null } | null;
  reflection?: { valuedQualities: string[]; sharingTopics: string | null } | null;
};

const SENIORITY_ORDER: SeniorityLevel[] = ["MID", "SENIOR", "EXECUTIVE", "FOUNDER"];

function seniorityProximity(a: SeniorityLevel | null, b: SeniorityLevel | null) {
  if (!a || !b) return 0;
  const ai = SENIORITY_ORDER.indexOf(a);
  const bi = SENIORITY_ORDER.indexOf(b);
  const diff = Math.abs(ai - bi);
  if (diff === 0) return 1;
  if (diff === 1) return 0.6;
  return 0.2;
}

function sharedCount(a: string[], b: string[]) {
  const setB = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((x) => setB.has(x.toLowerCase())).length;
}

export function scoreMentorMatch(self: MentorMatchInput, other: MentorMatchInput) {
  if (self.userId === other.userId) return { score: 0, reasons: [] as string[] };

  const selfSkills = [
    ...self.expertise,
    ...self.skills.map((s) => s.skill),
  ];
  const otherSkills = [
    ...other.expertise,
    ...other.skills.map((s) => s.skill),
  ];
  const skillOverlap = sharedCount(selfSkills, otherSkills);
  const skillScore = Math.min(skillOverlap / 5, 1) * 30;

  const industryScore =
    self.industry && other.industry && self.industry.toLowerCase() === other.industry.toLowerCase()
      ? 20
      : 0;

  const cityScore =
    self.city && other.city && self.city.toLowerCase() === other.city.toLowerCase() ? 15 : 0;

  const seniorityScore = seniorityProximity(self.seniorityLevel, other.seniorityLevel) * 15;

  const selfInterests = [
    ...self.interests,
    ...(self.reflection?.valuedQualities ?? []),
  ];
  const otherInterests = [
    ...other.interests,
    ...(other.reflection?.valuedQualities ?? []),
  ];
  const interestOverlap = sharedCount(selfInterests, otherInterests);
  const interestScore = Math.min(interestOverlap / 3, 1) * 20;

  const score = skillScore + industryScore + cityScore + seniorityScore + interestScore;

  const reasons: string[] = [];
  if (skillOverlap > 0) reasons.push(`${skillOverlap} shared skill${skillOverlap > 1 ? "s" : ""}`);
  if (industryScore > 0) reasons.push(`Same industry (${other.industry})`);
  if (cityScore > 0) reasons.push(other.city!);
  if (seniorityScore >= 12) reasons.push("Similar seniority");
  if (interestOverlap > 0) reasons.push(`${interestOverlap} shared interest${interestOverlap > 1 ? "s" : ""}`);

  return { score: Math.round(score), reasons };
}
