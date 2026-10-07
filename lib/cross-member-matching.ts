function sharedCount(a: string[], b: string[]) {
  const setB = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((x) => setB.has(x.toLowerCase())).length;
}

type MentorSide = {
  industry: string | null;
  city: string | null;
  expertise: string[];
};

type MenteeSide = {
  preferredIndustry: string | null;
  city: string | null;
  guidanceAreas: string[];
  languages: string[];
};

export function scoreCrossMemberMatch(mentor: MentorSide, mentee: MenteeSide) {
  const industryScore =
    mentor.industry &&
    mentee.preferredIndustry &&
    mentor.industry.toLowerCase() === mentee.preferredIndustry.toLowerCase()
      ? 30
      : 0;

  const cityScore =
    mentor.city && mentee.city && mentor.city.toLowerCase() === mentee.city.toLowerCase()
      ? 25
      : 0;

  const guidanceOverlap = sharedCount(mentee.guidanceAreas, mentor.expertise);
  const guidanceScore = Math.min(guidanceOverlap / 2, 1) * 25;

  const reasons: string[] = [];
  if (industryScore > 0) reasons.push(`Industry: ${mentee.preferredIndustry}`);
  if (cityScore > 0) reasons.push(mentee.city!);
  if (guidanceOverlap > 0) {
    reasons.push(`${guidanceOverlap} aligned guidance/expertise area(s)`);
  }

  const score = Math.round(industryScore + cityScore + guidanceScore);
  return { score, reasons };
}
