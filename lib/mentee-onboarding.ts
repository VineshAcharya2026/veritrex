import type { MenteeCurrentStatus, MentoringFormat } from "@/lib/db/types";

export const CURRENT_STATUS_OPTIONS: { value: MenteeCurrentStatus; label: string }[] = [
  { value: "STUDENT", label: "Student" },
  { value: "GRADUATE", label: "Graduate" },
  { value: "PROFESSIONAL", label: "Professional" },
  { value: "ENTREPRENEUR", label: "Entrepreneur" },
  { value: "CAREER_BREAK", label: "Career Break" },
  { value: "CAREER_SWITCHER", label: "Career Switcher" },
];

export const QUALIFICATION_OPTIONS = [
  "High School",
  "Diploma",
  "Bachelor's",
  "Master's",
  "PhD",
  "Other",
];

export const YEARS_OF_EXPERIENCE_OPTIONS = ["Fresher", "0-2", "3-5", "6-10", "10+"];

export const GUIDANCE_OPTIONS = [
  "Career Confusion",
  "Interview Preparation",
  "Leadership",
  "Career Transition",
  "Job Search",
  "Personal Branding",
  "Start-ups",
  "Higher Studies",
  "Public Speaking",
  "Networking",
  "Salary Negotiation",
  "Workplace Conflicts",
];

export const MODE_OPTIONS: MentoringFormat[] = ["VIDEO", "AUDIO", "CHAT", "GROUP", "ASYNC"];

export const LANGUAGE_OPTIONS = [
  "English",
  "Hindi",
  "Kannada",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Marathi",
  "Bengali",
  "Gujarati",
  "Punjabi",
  "Urdu",
  "Spanish",
  "French",
  "Arabic",
];

export const INDUSTRY_OPTIONS = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Retail",
  "Consulting",
  "Media & Entertainment",
  "Government & Public Sector",
  "Non-profit",
  "Energy",
  "Real Estate",
  "Hospitality",
  "Legal",
  "Other",
];

export const COUNTRY_OPTIONS = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "United Arab Emirates",
  "Singapore",
  "Germany",
  "France",
  "Netherlands",
  "Ireland",
  "New Zealand",
  "Other",
];

/** The fields required to consider mentee onboarding complete. Preferred name (Q2) is optional. */
export type MenteeOnboardingData = {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  currentStatus?: string | null;
  highestQualification?: string | null;
  currentInstitution?: string | null;
  currentDesignation?: string | null;
  yearsOfExperience?: string | null;
  preferredIndustry?: string | null;
  careerGoal?: string | null;
  guidanceAreas?: string[] | null;
  skillsToDevelo?: string[] | null;
  preferredMentorProfile?: string | null;
  preferredModes?: string[] | null;
  languages?: string[] | null;
  biggestChallenge?: string | null;
  successDefinition?: string | null;
};

function hasText(value?: string | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasItems(value?: string[] | null): boolean {
  return Array.isArray(value) && value.length > 0;
}

export function isMenteeOnboardingComplete(data: MenteeOnboardingData): boolean {
  return (
    hasText(data.firstName) &&
    hasText(data.lastName) &&
    hasText(data.phone) &&
    hasText(data.country) &&
    hasText(data.city) &&
    hasText(data.currentStatus) &&
    hasText(data.highestQualification) &&
    hasText(data.currentInstitution) &&
    hasText(data.currentDesignation) &&
    hasText(data.yearsOfExperience) &&
    hasText(data.preferredIndustry) &&
    hasText(data.careerGoal) &&
    hasItems(data.guidanceAreas) &&
    hasItems(data.skillsToDevelo) &&
    hasText(data.preferredMentorProfile) &&
    hasItems(data.preferredModes) &&
    hasItems(data.languages) &&
    hasText(data.biggestChallenge) &&
    hasText(data.successDefinition)
  );
}
