import type { RolePlanId } from "@/components/home/rolePlans";
import { BRAND } from "@/lib/brand";

export const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#plans", label: "Roles" },
  { href: "#community", label: "Community" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
] as const;

export const VERITRA_NEWS = [
  {
    title: "TrustScore Engine now live across all mentorship sessions",
    date: "Jul 2026",
    href: "#about",
  },
  {
    title: "Elite Founder 100 mentors programme open for applications",
    date: "Jun 2026",
    href: "#plans",
  },
  {
    title: "Nation-building mentorship cap set at 5 free hours per mentor",
    date: "Jun 2026",
    href: "#faq",
  },
] as const;

export const BENEFITS: { text: string; highlight?: string }[] = [
  {
    text: "Immutable TrustScore Engine with blind submissions, anti-collusion safeguards, and rater-credibility weighting.",
    highlight: "Institutional-grade validation",
  },
  {
    text: "Structured Mentor-Mentee Marketplace removes high cost and network prerequisites for early-career talent.",
    highlight: "Accessible mentorship",
  },
  {
    text: "Milestone-split referral hiring incentives (30/40/30) over 180 days align long-term performance with reward.",
    highlight: "Referral hiring framework",
  },
  {
    text: "Rich portfolio evidence integrated into hiring workflows so recruiters vet talent seamlessly.",
    highlight: "Professional Credibility Engine",
  },
  {
    text: "Structured credit mechanics reward mentorship completion, nation-building, and thought leadership.",
    highlight: "Credit-based rewards",
  },
  {
    text: "Academic alliances and nation-building programmes connect mentors to legacy impact beyond one-to-one sessions.",
    highlight: "Nation-building mission",
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: `Create your ${BRAND.name} profile`,
    description:
      "Join as mentor or mentee. Share expertise, goals, portfolio evidence, and preferred focus areas.",
  },
  {
    step: 2,
    title: "Connect with purpose",
    description:
      "Mentees discover mentors by skills and industry. Mentors review fit, accept matches, and peers connect through Find Friends.",
  },
  {
    step: 3,
    title: "Grow with accountability",
    description:
      "Complete structured sessions, submit bilateral ratings, earn credits, and build a verified professional proof record.",
  },
] as const;

export const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: `Who can join ${BRAND.name}?`,
    answer:
      "Mentors share expertise and build legacy. Mentees access structured guidance without network prerequisites. Platform admins oversee quality, TrustScore integrity, and access.",
  },
  {
    question: "What is the TrustScore Engine?",
    answer:
      `TrustScore is ${BRAND.name}'s multi-layered credibility system. Bilateral session ratings use blind submission rules, anti-collusion safeguards, and rater-credibility weighting to produce a fraud-resistant reputation tier.`,
  },
  {
    question: "How does Referral Hiring work?",
    answer:
      "Our Referral Hiring framework uses milestone-split retention incentives (30% at hire, 40% at 90 days, 30% at 180 days) to align long-term performance with direct reward. Full workflow rollout is coming soon.",
  },
  {
    question: "How many free mentorship hours can mentors offer?",
    answer: `Mentors offering nation-building (free or concessional) mentorship are capped at ${BRAND.freeMentorshipHoursCap} hours per cycle — not 12. This keeps impact sustainable while expanding access.`,
  },
  {
    question: "What is the Elite Founder 100?",
    answer:
      "Elite Founder 100 is an exclusive cohort of founding mentors recognised for exceptional thought leadership, nation-building impact, and platform contribution. Membership is awarded by admin review.",
  },
  {
    question: "How do mentor credits work?",
    answer:
      "Mentors earn credits for completed mentorships, verified nation-building outcomes, published content, and free sessions. Credits contribute to thought leadership score; cash-out unlocks after bilateral rated sessions.",
  },
  {
    question: "What is the Inner Circle?",
    answer:
      "The Inner Circle is an exclusive mentor network for lateral companion matching and high-level peer interaction. Mentors apply via the dashboard with a commitment statement and nation-building examples.",
  },
  {
    question: `Where is ${BRAND.name} based?`,
    answer: `${BRAND.name} operates from ${BRAND.address}. Reach us at ${BRAND.email} or ${BRAND.phoneDisplay}.`,
  },
];

export const QUICK_START_ROLES: { value: RolePlanId; label: string }[] = [
  { value: "MENTOR", label: "Mentor — guide others" },
  { value: "MENTEE", label: "Mentee — find a mentor" },
];

export const FOOTER_LINKS = {
  quick: [
    { href: "#about", label: `About ${BRAND.name}` },
    { href: "#plans", label: "Choose a role" },
    { href: "#community", label: "Community feed" },
    { href: "/leaderboard", label: "Impact leaderboard" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#faq", label: "FAQ" },
    { href: "#contact", label: "Contact" },
    { href: "/login", label: "Sign in" },
    { href: "/register", label: "Register" },
  ],
  contact: {
    email: BRAND.email,
    phone: BRAND.phoneDisplay,
    phoneHref: BRAND.phoneHref,
    address: BRAND.address,
    website: BRAND.website,
    tagline: BRAND.tagline,
  },
};
