import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RecentPostsSection } from "@/components/feed/RecentPostsSection";
import { ProfileHeader, ProfileSectionCard } from "@/components/profile/ProfileHeader";
import { getMentorImpact } from "@/lib/nation-building-impact";
import { BADGE_META } from "@/lib/nation-building";
import type { NationBuildingBadge } from "@/lib/db/types";
import { Award, MapPin, Building2, CheckCircle } from "lucide-react";

export default async function PublicMentorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      mentorProfile: {
        include: {
          skills: { orderBy: { masteryLevel: "desc" }, take: 10 },
        },
      },
      trustScore: { select: { tier: true } },
    },
  });

  if (!user || user.role !== "MENTOR" || !user.mentorProfile) notFound();

  const p = user.mentorProfile;
  const profile = user.profile;
  const trust = user.trustScore;
  const name = profile ? `${profile.firstName} ${profile.lastName}` : "Mentor";
  const headline = p.professionalHeadline ?? p.title ?? "";

  const [impact, badgeRecords] = await Promise.all([
    getMentorImpact(id),
    prisma.mentorNationBuildingBadge.findMany({
      where: { mentorId: id },
      orderBy: { earnedAt: "asc" },
    }),
  ]);
  const badges = badgeRecords.map((b: { badge: NationBuildingBadge }) => b.badge);
  const featuredStories = impact.entries
    .filter((e) => e.category === "IMPACT_STORY" && e.verified)
    .slice(0, 3);
  const hasImpact =
    impact.composite > 0 || badges.length > 0 || featuredStories.length > 0;
  const impactKpis: { label: string; value: number }[] = [
    { label: "People Impacted", value: impact.kpis.peopleImpacted },
    { label: "Careers Transformed", value: impact.kpis.careersTransformed },
    { label: "Opportunities Created", value: impact.kpis.opportunitiesCreated },
    { label: "Volunteer Hours", value: impact.kpis.volunteerHours },
  ];

  return (
    <div className="min-h-screen bg-[#f3f2ef]">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <ProfileHeader
          name={name}
          avatar={profile?.avatar ?? null}
          coverImage={profile?.coverImage ?? null}
          headline={headline}
          summary={p.professionalSummary}
          location={p.city}
          tier={(trust?.tier as string) ?? "EMERGING"}
          userId={id}
          primaryAction={{
            href: `/dashboard/mentee/mentors?request=${id}`,
            label: "Request mentorship",
          }}
          linkedInUrl={p.linkedInUrl}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            {p.whyMentor && (
              <ProfileSectionCard title="Why I Mentor">
                <p className="text-sm italic text-primary/70">&ldquo;{p.whyMentor}&rdquo;</p>
              </ProfileSectionCard>
            )}

            {p.areasOfExpertise.length > 0 && (
              <ProfileSectionCard title="Expertise">
                <div className="flex flex-wrap gap-2">
                  {p.areasOfExpertise.map((e: string) => (
                    <span
                      key={e}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/[0.02] px-3 py-1 text-sm text-primary/80"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-accent" />
                      {e}
                    </span>
                  ))}
                </div>
              </ProfileSectionCard>
            )}

            {p.challengesCanHelp.length > 0 && (
              <ProfileSectionCard title="I Can Help You With">
                <ul className="list-inside list-disc space-y-1 text-sm text-primary/70">
                  {p.challengesCanHelp.map((c: string) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </ProfileSectionCard>
            )}

            {p.mentoringStyle.length > 0 && (
              <ProfileSectionCard title="My Mentoring Style">
                <p className="text-sm text-primary/70">{p.mentoringStyle.join(" + ")}</p>
              </ProfileSectionCard>
            )}

            {p.achievements && (
              <ProfileSectionCard title="Professional Highlights">
                <p className="whitespace-pre-line text-sm text-primary/70">{p.achievements}</p>
              </ProfileSectionCard>
            )}

            {hasImpact && (
              <ProfileSectionCard
                title="Impact Score"
                action={
                  <span className="text-sm font-semibold text-accent">
                    Score {impact.composite.toLocaleString()}
                  </span>
                }
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {impactKpis.map((k) => (
                    <div
                      key={k.label}
                      className="rounded-lg border border-primary/8 bg-primary/[0.02] p-3 text-center"
                    >
                      <p className="text-xl font-bold text-primary">{k.value}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{k.label}</p>
                    </div>
                  ))}
                </div>
                {badges.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {badges.map((b) => (
                      <span
                        key={b}
                        className="rounded-sm bg-accent/15 px-3 py-1 text-xs font-semibold text-accent"
                        title={BADGE_META[b].description}
                      >
                        {BADGE_META[b].label}
                      </span>
                    ))}
                  </div>
                )}
                {featuredStories.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {featuredStories.map((story) => (
                      <div
                        key={story.id}
                        className="rounded-lg border border-primary/8 bg-primary/[0.02] p-3"
                      >
                        <p className="font-semibold text-primary">{story.title}</p>
                        {story.testimonial && (
                          <p className="mt-1 text-sm italic text-primary/70">
                            &ldquo;{story.testimonial}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ProfileSectionCard>
            )}

            {p.influentialQuote && (
              <ProfileSectionCard title="Favourite Quote">
                <p className="text-sm italic text-primary/70">
                  &ldquo;{p.influentialQuote}&rdquo;
                </p>
              </ProfileSectionCard>
            )}

            {p.welcomeMessage && (
              <ProfileSectionCard title="Message to Mentees">
                <p className="text-sm italic text-primary/70">
                  &ldquo;{p.welcomeMessage}&rdquo;
                </p>
              </ProfileSectionCard>
            )}

            <ProfileSectionCard title="Activity">
              <RecentPostsSection authorId={id} hideHeader />
            </ProfileSectionCard>
          </div>

          <aside className="space-y-4">
            <ProfileSectionCard title="About">
              <ul className="space-y-2 text-sm text-muted">
                {p.city && (
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {p.city}
                  </li>
                )}
                {p.industry && (
                  <li className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {p.industry}
                  </li>
                )}
                {p.yearsOfExperienceRange && (
                  <li className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    {p.yearsOfExperienceRange} years
                  </li>
                )}
                {p.languages.length > 0 && (
                  <li className="text-primary/70">
                    Languages: {p.languages.join(", ")}
                  </li>
                )}
                {p.company && (
                  <li className="text-primary/70">
                    {p.title ? `${p.title} at ` : ""}
                    {p.company}
                  </li>
                )}
              </ul>
            </ProfileSectionCard>

            {p.skills.length > 0 && (
              <ProfileSectionCard title="Skills">
                <div className="flex flex-wrap gap-2">
                  {p.skills.map((s: { skill: string; masteryLevel: number }) => (
                    <span
                      key={s.skill}
                      className="rounded-full border border-primary/10 px-2.5 py-1 text-xs text-primary/80"
                    >
                      {s.skill}
                      <span className="ml-1 text-muted">· {s.masteryLevel}/5</span>
                    </span>
                  ))}
                </div>
              </ProfileSectionCard>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
