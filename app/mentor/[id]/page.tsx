import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TrustScoreBadge } from "@/components/rating/TrustScoreBadge";
import { Award, MapPin, Building2, Linkedin, CheckCircle } from "lucide-react";

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
      trustScore: { select: { tier: true, totalScore: true } },
    },
  });

  if (!user || user.role !== "MENTOR" || !user.mentorProfile) notFound();

  const p = user.mentorProfile;
  const profile = user.profile;
  const trust = user.trustScore;
  const name = profile ? `${profile.firstName} ${profile.lastName}` : "Mentor";
  const headline = p.professionalHeadline ?? p.title ?? "";

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      {/* Header */}
      <div className="flex items-start gap-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent/10 text-2xl font-bold text-accent">
          {profile?.avatar ? (
            <img src={profile.avatar} alt={name} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            name.charAt(0)
          )}
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-primary">{name}</h1>
          <TrustScoreBadge tier={(trust?.tier as any) ?? "EMERGING"} />
          <p className="text-sm text-muted">{headline}</p>
          {p.professionalSummary && (
            <p className="mt-2 text-sm text-primary/70">{p.professionalSummary}</p>
          )}
        </div>
      </div>

      <hr className="border-primary/10" />

      {/* Why I Mentor */}
      {p.whyMentor && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-primary">Why I Mentor</h2>
          <p className="text-sm italic text-primary/70">&ldquo;{p.whyMentor}&rdquo;</p>
        </section>
      )}

      {/* Expertise */}
      {p.areasOfExpertise.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-primary">Expertise</h2>
          <div className="flex flex-wrap gap-2">
            {p.areasOfExpertise.map((e) => (
              <span key={e} className="flex items-center gap-1.5 text-sm text-primary/80">
                <CheckCircle className="h-4 w-4 text-accent" />{e}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* I Can Help You With */}
      {p.challengesCanHelp.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-primary">I Can Help You With</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-primary/70">
            {p.challengesCanHelp.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </section>
      )}

      {/* Mentoring Style */}
      {p.mentoringStyle.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-primary">My Mentoring Style</h2>
          <p className="text-sm text-primary/70">{p.mentoringStyle.join(" + ")}</p>
        </section>
      )}

      {/* Languages */}
      {p.languages.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-primary">Languages</h2>
          <p className="text-sm text-primary/70">{p.languages.join(", ")}</p>
        </section>
      )}

      {/* Professional Highlights */}
      {p.achievements && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-primary">Professional Highlights</h2>
          <p className="whitespace-pre-line text-sm text-primary/70">{p.achievements}</p>
        </section>
      )}

      {/* Quote */}
      {p.influentialQuote && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-primary">Favourite Quote</h2>
          <p className="text-sm italic text-primary/70">&ldquo;{p.influentialQuote}&rdquo;</p>
        </section>
      )}

      {/* Message */}
      {p.welcomeMessage && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-primary">Message to Mentees</h2>
          <p className="text-sm italic text-primary/70">&ldquo;{p.welcomeMessage}&rdquo;</p>
        </section>
      )}

      <hr className="border-primary/10" />

      {/* Location & Meta */}
      <div className="flex flex-wrap gap-4 text-sm text-muted">
        {p.city && (
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{p.city}</span>
        )}
        {p.industry && (
          <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{p.industry}</span>
        )}
        {p.yearsOfExperienceRange && (
          <span className="flex items-center gap-1"><Award className="h-4 w-4" />{p.yearsOfExperienceRange} years</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/dashboard/mentee/mentors?request=${id}`}
          className="inline-flex items-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
        >
          Book a Session
        </Link>
        {p.linkedInUrl && (
          <a
            href={p.linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-primary/10 px-6 py-3 text-sm text-accent hover:bg-accent/5"
          >
            <Linkedin className="h-4 w-4" />LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}
