import { GraduationCap, Target, type LucideIcon } from "lucide-react";
import { BRAND } from "@/lib/brand";

export type RolePlanId = "MENTOR" | "MENTEE";
export type RolePlanTheme = "teal" | "gold";

export type RolePlan = {
  id: RolePlanId;
  title: string;
  headline: string;
  summary: string;
  highlights: string[];
  features: string[];
  steps: string[];
  icon: LucideIcon;
  theme: RolePlanTheme;
  accentClass: string;
};

export const ROLE_PLANS: RolePlan[] = [
  {
    id: "MENTOR",
    title: "Mentor",
    headline: "Forge legacy. Earn credibility. Shape careers.",
    summary:
      `Build your ${BRAND.name} mentor profile, guide mentees through structured sessions, earn credits, and contribute to impact with up to 5 free hours per cycle.`,
    highlights: ["Earn credits", "Build TrustScore", "Nation building"],
    features: [
      "Showcase skills, mastery levels, and professional portfolio evidence",
      "Earn credits for completed mentorships, content, and verified outcomes",
      "Offer up to 5 hours of free/concessional nation-building mentorship",
      "Access Find Friends for peer matching by industry, seniority, and interests",
      "Apply for the exclusive Inner Circle and Elite Founder 100 recognition",
      "Track thought leadership score, mentee ratings, and platform performance",
      "Publish posts, podcasts, videos, and pictures on your public profile",
    ],
    steps: [
      `Register as a Mentor on ${BRAND.name}`,
      "Complete your profile with expertise, LinkedIn, and skills",
      "Accept mentorship requests and complete bilateral-rated sessions",
      "Earn credits, log nation-building outcomes, and cash out when eligible",
    ],
    icon: GraduationCap,
    theme: "teal",
    accentClass: "from-landing-teal to-landing-tealDark",
  },
  {
    id: "MENTEE",
    title: "Mentee",
    headline: "Find mentors. Build proof. Elevate your career.",
    summary:
      "Discover mentors without network prerequisites, set clear goals, rate sessions bilaterally, and build a LinkedIn-style credibility profile recruiters can trust.",
    highlights: ["Smart matching", "TrustScore growth", "Career proof"],
    features: [
      "Search mentors by expertise, industry, company, and guidance areas",
      "Structured mentorship journeys with session outcomes and ratings",
      "Build a LinkedIn-format public profile with goals and portfolio evidence",
      "Grow your TrustScore through accountable session feedback",
      "Connect with peers through the networking directory",
      "Browse mentor podcasts, posts, and thought leadership on the community feed",
      "Access referral hiring pathways as the programme expands",
    ],
    steps: [
      `Register as a Mentee on ${BRAND.name}`,
      "Set career goals, skills to develop, and preferred mentor profile",
      "Browse mentors and send thoughtful requests",
      "Complete sessions, submit ratings, and build verified career proof",
    ],
    icon: Target,
    theme: "gold",
    accentClass: "from-landing-gold to-landing-goldDark",
  },
];

export function getRolePlan(id: RolePlanId): RolePlan | undefined {
  return ROLE_PLANS.find((p) => p.id === id);
}
