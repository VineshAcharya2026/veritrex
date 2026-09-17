import type { MenteeCurrentStatus, MentoringFormat } from "@/lib/db/types";

type MenteeMatchInput = {
  userId: string;
  country: string | null;
  city: string | null;
  currentStatus: MenteeCurrentStatus | null;
  preferredIndustry: string | null;
  guidanceAreas: string[];
  skillsToDevelo: string[];
  preferredModes: MentoringFormat[];
  languages: string[];
  profile?: { firstName: string; lastName: string; avatar: string | null } | null;
};

function sharedCount(a: string[], b: string[]) {
  const setB = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((x) => setB.has(x.toLowerCase())).length;
}

export function scoreMenteeMatch(self: MenteeMatchInput, other: MenteeMatchInput) {
  if (self.userId === other.userId) return { score: 0, reasons: [] as string[] };

  const guidanceOverlap = sharedCount(self.guidanceAreas, other.guidanceAreas);
  const skillOverlap = sharedCount(self.skillsToDevelo, other.skillsToDevelo);
  const languageOverlap = sharedCount(self.languages, other.languages);
  const modeOverlap = sharedCount(
    self.preferredModes.map(String),
    other.preferredModes.map(String)
  );

  const industryScore =
    self.preferredIndustry &&
    other.preferredIndustry &&
    self.preferredIndustry.toLowerCase() === other.preferredIndustry.toLowerCase()
      ? 25
      : 0;

  const cityScore =
    self.city && other.city && self.city.toLowerCase() === other.city.toLowerCase() ? 20 : 0;

  const statusScore =
    self.currentStatus && other.currentStatus && self.currentStatus === other.currentStatus
      ? 15
      : 0;

  const guidanceScore = Math.min(guidanceOverlap / 3, 1) * 20;
  const skillScore = Math.min(skillOverlap / 3, 1) * 10;
  const languageScore = Math.min(languageOverlap / 2, 1) * 5;
  const modeScore = Math.min(modeOverlap / 2, 1) * 5;

  const score =
    industryScore + cityScore + statusScore + guidanceScore + skillScore + languageScore + modeScore;

  const reasons: string[] = [];
  if (guidanceOverlap > 0) {
    reasons.push(`${guidanceOverlap} shared guidance area${guidanceOverlap > 1 ? "s" : ""}`);
  }
  if (skillOverlap > 0) reasons.push(`${skillOverlap} shared skill focus`);
  if (industryScore > 0) reasons.push(`Same industry (${other.preferredIndustry})`);
  if (cityScore > 0) reasons.push(other.city!);
  if (statusScore > 0) reasons.push("Similar career stage");
  if (languageOverlap > 0) reasons.push(`${languageOverlap} shared language${languageOverlap > 1 ? "s" : ""}`);

  return { score: Math.round(score), reasons };
}
