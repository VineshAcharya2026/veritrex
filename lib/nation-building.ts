import type {
  NationBuildingBadge,
  NationBuildingCategory,
  NationBuildingSource,
} from "@/lib/db/types";

/** JSON-serialized shapes returned by the nation-building API (dates as strings). */
export type ImpactKpisDTO = {
  peopleImpacted: number;
  careersTransformed: number;
  opportunitiesCreated: number;
  volunteerHours: number;
};

export type SectionSummaryDTO = {
  category: NationBuildingCategory;
  verifiedCount: number;
  verifiedQuantity: number;
  pendingCount: number;
};

export type NationBuildingEntryDTO = {
  id: string;
  category: NationBuildingCategory;
  title: string;
  description: string | null;
  quantity: number;
  eventDate: string | null;
  location: string | null;
  testimonial: string | null;
  evidenceUrls: string[];
  source: NationBuildingSource;
  verified: boolean;
  createdAt: string;
};

/** Unit each category's `quantity` field represents, used for labels and KPI math. */
export type CategoryUnit = "sessions" | "people" | "hours" | "count";

export type CategoryMeta = {
  category: NationBuildingCategory;
  label: string;
  description: string;
  unit: CategoryUnit;
  /** Categories a mentor can add manually from the UI. */
  manual: boolean;
};

export const NATION_BUILDING_CATEGORIES: CategoryMeta[] = [
  {
    category: "FREE_MENTORING",
    label: "Free Mentoring",
    description: "Number of free mentoring sessions.",
    unit: "sessions",
    manual: true,
  },
  {
    category: "UNDERPRIVILEGED_MENTEES",
    label: "Underprivileged Mentees",
    description: "People from underserved backgrounds supported.",
    unit: "people",
    manual: true,
  },
  {
    category: "CAREER_GROWTH",
    label: "Career Growth",
    description: "Mentees helped to change careers or earn promotions.",
    unit: "people",
    manual: true,
  },
  {
    category: "JOBS_REFERRALS",
    label: "Jobs & Referrals",
    description: "Verified job referrals and successful placements.",
    unit: "count",
    manual: true,
  },
  {
    category: "STARTUP_SUCCESS",
    label: "Startup Success",
    description: "Helped launch startups, raise funding or scale businesses.",
    unit: "count",
    manual: true,
  },
  {
    category: "GROUP_MENTORING",
    label: "Group Mentoring",
    description: "Bootcamps, mentoring circles and cohort sessions.",
    unit: "people",
    manual: true,
  },
  {
    category: "MASTERCLASSES",
    label: "Masterclasses",
    description: "Free masterclasses, guest lectures and workshops.",
    unit: "count",
    manual: true,
  },
  {
    category: "COMMUNITY_SERVICE",
    label: "Community Service",
    description: "University visits, company visits and career awareness programmes.",
    unit: "count",
    manual: true,
  },
  {
    category: "VOLUNTEER_HOURS",
    label: "Volunteer Hours",
    description: "Total hours contributed voluntarily.",
    unit: "hours",
    manual: true,
  },
  {
    category: "IMPACT_STORY",
    label: "Impact Stories",
    description: "Up to 10 verified stories with photos, documents and testimonials.",
    unit: "count",
    manual: true,
  },
];

export const CATEGORY_LABELS: Record<NationBuildingCategory, string> = Object.fromEntries(
  NATION_BUILDING_CATEGORIES.map((c) => [c.category, c.label])
) as Record<NationBuildingCategory, string>;

export const MAX_IMPACT_STORIES = 10;

export const BADGE_META: Record<
  NationBuildingBadge,
  { label: string; description: string }
> = {
  COMMUNITY_MENTOR: {
    label: "Community Mentor",
    description: "20+ volunteer hours or 3+ community service contributions.",
  },
  CAREER_CATALYST: {
    label: "Career Catalyst",
    description: "Helped 5+ mentees grow their careers or earn promotions.",
  },
  STARTUP_ENABLER: {
    label: "Startup Enabler",
    description: "Enabled 2+ startups to launch, raise or scale.",
  },
  EDUCATION_CHAMPION: {
    label: "Education Champion",
    description: "Delivered 3+ masterclasses, lectures or workshops.",
  },
  OPPORTUNITY_CREATOR: {
    label: "Opportunity Creator",
    description: "Created 5+ verified jobs or referrals.",
  },
  NATION_BUILDER: {
    label: "Nation Builder",
    description: "Outstanding, wide-ranging verified social impact.",
  },
};
