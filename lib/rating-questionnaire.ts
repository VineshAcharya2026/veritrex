import { z } from "zod";

export type RatingDimension = {
  key: string;
  label: string;
  weight: number;
};

/** Questionnaire A — mentee rates mentor (weights sum to 1.0) */
export const MENTEE_RATES_MENTOR_DIMENSIONS = [
  {
    key: "impact",
    label: "How much impact did this session have on your understanding/progress?",
    weight: 0.25,
  },
  {
    key: "productivity",
    label: "How productively was the session time used?",
    weight: 0.15,
  },
  {
    key: "goalAchievement",
    label: "Did the mentor help you achieve the specific goal you set for this session?",
    weight: 0.2,
  },
  {
    key: "realisticLearningPath",
    label:
      "Did this session realistically move you toward your larger career/learning goal (not just today's task)?",
    weight: 0.15,
  },
  {
    key: "approach",
    label:
      "How would you rate the mentor's approach/teaching style (clarity, method, engagement)?",
    weight: 0.15,
  },
  {
    key: "mannersRespect",
    label: "Was the mentor respectful and professional in manner?",
    weight: 0.1,
  },
] as const satisfies readonly RatingDimension[];

/** Questionnaire B — mentor rates mentee (weights sum to 1.0) */
export const MENTOR_RATES_MENTEE_DIMENSIONS = [
  {
    key: "preparedness",
    label: "Did the mentee come prepared for this session?",
    weight: 0.2,
  },
  {
    key: "taskCompletion",
    label: "Did the mentee complete tasks/assignments agreed in the last session?",
    weight: 0.2,
  },
  {
    key: "sessionGoals",
    label: "Did the mentee meet the specific goal set for this session?",
    weight: 0.2,
  },
  {
    key: "implementation",
    label: "Did the mentee show they're applying/implementing what they've learned?",
    weight: 0.15,
  },
  {
    key: "growth",
    label: "Have you noticed genuine growth in the mentee over time?",
    weight: 0.15,
  },
  {
    key: "respectBehavior",
    label: "Was the mentee respectful, engaged, and positive in their behavior?",
    weight: 0.1,
  },
] as const satisfies readonly RatingDimension[];

export type MenteeRatesMentorKey =
  (typeof MENTEE_RATES_MENTOR_DIMENSIONS)[number]["key"];
export type MentorRatesMenteeKey =
  (typeof MENTOR_RATES_MENTEE_DIMENSIONS)[number]["key"];

export const menteeRatesMentorKeys = MENTEE_RATES_MENTOR_DIMENSIONS.map(
  (d) => d.key
) as MenteeRatesMentorKey[];

export const mentorRatesMenteeKeys = MENTOR_RATES_MENTEE_DIMENSIONS.map(
  (d) => d.key
) as MentorRatesMenteeKey[];

export const MENTEE_RATES_MENTOR_WEIGHTS = Object.fromEntries(
  MENTEE_RATES_MENTOR_DIMENSIONS.map((d) => [d.key, d.weight])
) as Record<MenteeRatesMentorKey, number>;

export const MENTOR_RATES_MENTEE_WEIGHTS = Object.fromEntries(
  MENTOR_RATES_MENTEE_DIMENSIONS.map((d) => [d.key, d.weight])
) as Record<MentorRatesMenteeKey, number>;

const starDim = z.number().int().min(1).max(5);

function buildStarSchema<T extends readonly RatingDimension[]>(dims: T) {
  const shape = Object.fromEntries(dims.map((d) => [d.key, starDim])) as {
    [K in T[number]["key"]]: typeof starDim;
  };
  return z.object(shape);
}

export const menteeRatesMentorSchema = buildStarSchema(MENTEE_RATES_MENTOR_DIMENSIONS);
export const mentorRatesMenteeSchema = buildStarSchema(MENTOR_RATES_MENTEE_DIMENSIONS);

export type MenteeRatesMentorInput = z.infer<typeof menteeRatesMentorSchema>;
export type MentorRatesMenteeInput = z.infer<typeof mentorRatesMenteeSchema>;

export function formatWeightPercent(weight: number): string {
  return `${Math.round(weight * 100)}%`;
}

export function computeWeightedSessionScore(
  dims: Record<string, number>,
  weights: Record<string, number>
): number {
  let sum = 0;
  for (const [key, weight] of Object.entries(weights)) {
    sum += (dims[key] ?? 0) * weight;
  }
  return sum;
}
