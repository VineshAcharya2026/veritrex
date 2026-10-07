import { z } from "zod";

export type MentorshipRequestFieldType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "url"
  | "date";

export type MentorshipRequestField = {
  id: string;
  label?: string;
  type: MentorshipRequestFieldType;
  required: boolean;
  placeholder?: string;
  maxLength?: number;
  options?: { value: string; label: string }[];
  minSelected?: number;
};

export type MentorshipRequestQuestion = {
  id: string;
  label: string;
  helpText?: string;
  fields: MentorshipRequestField[];
};

export const MENTORSHIP_REQUEST_NOTE =
  "Requested hours and support are provisional. Your mentor will confirm the scope, schedule and achievable outcomes before mentorship begins.";

const FIELD_OPTIONS = [
  { value: "technology_it", label: "Technology/IT" },
  { value: "engineering", label: "Engineering" },
  { value: "business_management", label: "Business & Management" },
  { value: "finance_accounting", label: "Finance & Accounting" },
  { value: "marketing_sales", label: "Marketing & Sales" },
  { value: "healthcare_life_sciences", label: "Healthcare & Life Sciences" },
  { value: "education_research", label: "Education & Research" },
  { value: "law_public_policy", label: "Law & Public Policy" },
  { value: "design_creative", label: "Design & Creative Arts" },
  { value: "media_communication", label: "Media & Communication" },
  { value: "social_impact", label: "Social Impact/Non-profit" },
  { value: "other", label: "Other" },
];

const AREA_OPTIONS = [
  { value: "career_direction", label: "Career direction" },
  { value: "subject_technical", label: "Subject/technical skills" },
  { value: "project_guidance", label: "Project guidance" },
  { value: "portfolio", label: "Portfolio development" },
  { value: "leadership", label: "Leadership" },
  { value: "entrepreneurship", label: "Entrepreneurship" },
  { value: "interview_prep", label: "Interview preparation" },
  { value: "career_transition", label: "Career transition" },
  { value: "other", label: "Other" },
];

const ADDITIONAL_SUPPORT_OPTIONS = [
  { value: "learning_resources", label: "Learning resources" },
  { value: "practice_tasks", label: "Practice tasks" },
  { value: "project_reviews", label: "Project reviews" },
  { value: "portfolio_cv", label: "Portfolio/CV feedback" },
  { value: "mock_interviews", label: "Mock interviews" },
  { value: "progress_checkins", label: "Progress check-ins" },
  { value: "networking", label: "Networking guidance" },
  { value: "accessibility", label: "Accessibility support" },
  { value: "other", label: "Other" },
];

export const MENTORSHIP_REQUEST_QUESTIONS: MentorshipRequestQuestion[] = [
  {
    id: "q1_mentorship_needs",
    label:
      "What would you like mentorship in? Select your field and mentorship areas, then briefly describe the specific challenge you need help with.",
    fields: [
      {
        id: "field",
        label: "Field",
        type: "select",
        required: true,
        options: FIELD_OPTIONS,
      },
      {
        id: "areas",
        label: "Mentorship areas (select all that apply)",
        type: "multiselect",
        required: true,
        minSelected: 1,
        options: AREA_OPTIONS,
      },
      {
        id: "challenge",
        label: "Specific challenge",
        type: "textarea",
        required: true,
        placeholder: "Briefly describe what you need help with…",
        maxLength: 1500,
      },
    ],
  },
  {
    id: "q2_experience",
    label:
      "What experience do you already have in this area? Describe your current knowledge, relevant courses, previous work or projects. You may share a work sample or portfolio link.",
    fields: [
      {
        id: "experience_level",
        label: "Level",
        type: "select",
        required: true,
        options: [
          { value: "beginner", label: "Beginner" },
          { value: "some_practical", label: "Some practical experience" },
          { value: "intermediate", label: "Intermediate" },
          { value: "advanced", label: "Advanced" },
        ],
      },
      {
        id: "experience_details",
        label: "Description",
        type: "textarea",
        required: true,
        maxLength: 1500,
      },
      {
        id: "work_sample_url",
        label: "Work sample or portfolio link (optional)",
        type: "url",
        required: false,
        placeholder: "https://…",
      },
    ],
  },
  {
    id: "q3_challenge_guidance",
    label:
      "How challenging is your goal, and how much guidance do you need? Explain what you can do independently and where you feel stuck.",
    fields: [
      {
        id: "difficulty",
        label: "Difficulty",
        type: "select",
        required: true,
        options: [
          { value: "foundational", label: "Foundational" },
          { value: "moderate", label: "Moderate" },
          { value: "complex", label: "Complex" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "support_level",
        label: "Support needed",
        type: "select",
        required: true,
        options: [
          { value: "occasional", label: "Occasional advice" },
          { value: "regular", label: "Regular feedback" },
          { value: "close", label: "Close guidance and accountability" },
        ],
      },
      {
        id: "independence_notes",
        label: "What you can do independently / where you feel stuck (optional)",
        type: "textarea",
        required: false,
        maxLength: 1000,
      },
    ],
  },
  {
    id: "q4_hours_period",
    label:
      "How many total hours of mentorship are you requesting, and over what period? Include your preferred start date and usual availability.",
    fields: [
      {
        id: "total_hours",
        label: "Total hours requested",
        type: "select",
        required: true,
        options: [
          { value: "4", label: "4 hours" },
          { value: "6", label: "6 hours" },
          { value: "10", label: "10 hours" },
          { value: "12", label: "12 hours" },
        ],
      },
      {
        id: "period",
        label: "Preferred period",
        type: "select",
        required: true,
        options: [
          { value: "2_weeks", label: "2 weeks" },
          { value: "1_month", label: "1 month" },
          { value: "2_months", label: "2 months" },
          { value: "3_months", label: "3 months" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "start_date",
        label: "Preferred start date (optional)",
        type: "date",
        required: false,
      },
      {
        id: "availability",
        label: "Availability and time zone",
        type: "text",
        required: true,
        placeholder: "e.g. Weekday evenings IST, Saturday mornings…",
        maxLength: 300,
      },
    ],
  },
  {
    id: "q5_outcome",
    label:
      "What specific outcome do you want to achieve by the end? Describe what success would look like—for example, a completed project, improved skill, stronger portfolio or clear career plan.",
    fields: [
      {
        id: "outcome",
        label: "Desired outcome",
        type: "textarea",
        required: true,
        placeholder: "By the end of this mentorship, I want to…",
        maxLength: 1500,
      },
      {
        id: "outcome_deadline",
        label: "Optional deadline",
        type: "date",
        required: false,
      },
    ],
  },
  {
    id: "q6_additional_support",
    label:
      "What additional support would help you? Select what you need beyond the mentorship conversations.",
    fields: [
      {
        id: "additional_support",
        label: "Additional support (select all that apply)",
        type: "multiselect",
        required: false,
        options: ADDITIONAL_SUPPORT_OPTIONS,
      },
    ],
  },
  {
    id: "q7_commitment",
    label:
      "What commitment can you realistically make? How much time can you spend learning and completing agreed tasks between sessions?",
    fields: [
      {
        id: "weekly_hours",
        label: "Independent work per week",
        type: "select",
        required: true,
        options: [
          { value: "under_1", label: "Under 1 hour per week" },
          { value: "1_2", label: "1–2 hours per week" },
          { value: "3_5", label: "3–5 hours per week" },
          { value: "6_plus", label: "6+ hours per week" },
        ],
      },
      {
        id: "readiness",
        label: "Readiness",
        type: "select",
        required: true,
        options: [
          { value: "exploring", label: "Exploring" },
          { value: "regular_tasks", label: "Ready for regular tasks" },
          { value: "intensive", label: "Ready for an intensive plan" },
        ],
      },
    ],
  },
  {
    id: "q8_anything_else",
    label:
      "What else should your mentor know before accepting your request? Share your preferred learning style, expectations, relevant constraints and any deadline or previous mentorship experience.",
    fields: [
      {
        id: "additional_notes",
        label: "Additional information (optional)",
        type: "textarea",
        required: false,
        maxLength: 1500,
      },
    ],
  },
];

/** Flat list of all answer field ids (for schema and lookups). */
export const MENTORSHIP_REQUEST_FIELDS: MentorshipRequestField[] =
  MENTORSHIP_REQUEST_QUESTIONS.flatMap((q) => q.fields);

const LEGACY_FIELD_IDS = ["training_focus", "current_level", "outcome_90_days"];

export type MentorshipRequestAnswers = Record<string, string | string[]>;

function fieldSchema(f: MentorshipRequestField): z.ZodTypeAny {
  if (f.type === "multiselect") {
    const values = (f.options ?? []).map((o) => o.value);
    if (values.length === 0) {
      return f.required
        ? z.array(z.string()).min(f.minSelected ?? 1)
        : z.array(z.string()).optional().default([]);
    }
    const item = z.enum(values as [string, ...string[]]);
    let arr = z.array(item);
    if (f.required || (f.minSelected ?? 0) > 0) {
      arr = arr.min(f.minSelected ?? 1);
    }
    return f.required ? arr : arr.optional().default([]);
  }

  if (f.type === "url") {
    const emptyOrUrl = z
      .string()
      .trim()
      .refine((s) => s === "" || z.string().url().safeParse(s).success, {
        message: "Enter a valid URL or leave blank",
      });
    return f.required ? z.string().trim().url() : emptyOrUrl.optional().default("");
  }

  if (f.type === "date") {
    const dateOrEmpty = z
      .string()
      .trim()
      .refine((s) => s === "" || /^\d{4}-\d{2}-\d{2}$/.test(s), {
        message: "Use YYYY-MM-DD or leave blank",
      });
    return f.required ? z.string().regex(/^\d{4}-\d{2}-\d{2}$/) : dateOrEmpty.optional().default("");
  }

  if (f.type === "select") {
    const values = (f.options ?? []).map((o) => o.value);
    const base =
      values.length > 0
        ? z.enum(values as [string, ...string[]])
        : z.string().min(1);
    return f.required ? base : base.optional();
  }

  let s = z.string().trim();
  if (f.required) s = s.min(1, `${f.label ?? f.id} is required`);
  if (f.maxLength) s = s.max(f.maxLength);
  if (!f.required) return s.optional().default("");
  return s;
}

const requestAnswersShape: Record<string, z.ZodTypeAny> = {};
for (const f of MENTORSHIP_REQUEST_FIELDS) {
  requestAnswersShape[f.id] = fieldSchema(f);
}

export const mentorshipRequestAnswersSchema = z.object(requestAnswersShape);

function labelForOption(
  field: MentorshipRequestField | undefined,
  value: string
): string {
  const opt = field?.options?.find((o) => o.value === value);
  return opt?.label ?? value;
}

export function buildRequestSummary(answers: MentorshipRequestAnswers): string {
  const fieldVal = answers.field;
  const areas = answers.areas;
  const challenge = answers.challenge;

  const fieldLabel =
    typeof fieldVal === "string" && fieldVal
      ? labelForOption(
          MENTORSHIP_REQUEST_FIELDS.find((f) => f.id === "field"),
          fieldVal
        )
      : "";

  let areaPart = "";
  if (Array.isArray(areas) && areas.length > 0) {
    const fieldDef = MENTORSHIP_REQUEST_FIELDS.find((f) => f.id === "areas");
    const labels = areas.slice(0, 2).map((v) => labelForOption(fieldDef, v));
    areaPart = labels.join(", ");
    if (areas.length > 2) areaPart += "…";
  }

  let snippet = "";
  if (typeof challenge === "string" && challenge.trim()) {
    snippet = challenge.trim().replace(/\s+/g, " ").slice(0, 80);
    if (challenge.trim().length > 80) snippet += "…";
  }

  const parts: string[] = [];
  if (fieldLabel) parts.push(fieldLabel);
  if (areaPart) parts.push(areaPart);
  if (snippet) parts.push(snippet);

  if (parts.length > 0) {
    if (parts.length === 3) {
      return `${parts[0]} — ${parts[1]}: ${parts[2]}`;
    }
    return parts.join(" — ");
  }

  const focus = answers.training_focus;
  if (typeof focus === "string" && focus.trim()) {
    const s = focus.trim().replace(/\s+/g, " ").slice(0, 120);
    return s.length < focus.trim().length ? `${s}…` : s;
  }

  return "Mentorship request";
}

export function isLegacyRequestAnswers(
  requestAnswers: MentorshipRequestAnswers | null | undefined
): boolean {
  if (!requestAnswers || typeof requestAnswers !== "object") return false;
  const keys = Object.keys(requestAnswers);
  const hasNew = keys.some((k) =>
    MENTORSHIP_REQUEST_FIELDS.some((f) => f.id === k)
  );
  if (hasNew) return false;
  return LEGACY_FIELD_IDS.some((k) => k in requestAnswers);
}

export function formatAnswerForDisplay(
  fieldId: string,
  value: string | string[] | undefined
): string {
  if (value == null) return "—";
  const f = MENTORSHIP_REQUEST_FIELDS.find((x) => x.id === fieldId);
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value.map((v) => labelForOption(f, v)).join(", ");
  }
  if (f?.type === "select" || f?.type === "multiselect") {
    return labelForOption(f, value);
  }
  return value || "—";
}

export function getFieldById(fieldId: string): MentorshipRequestField | undefined {
  return MENTORSHIP_REQUEST_FIELDS.find((f) => f.id === fieldId);
}
