import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EliteFounderBadge } from "@/components/mentor/EliteFounderBadge";
import { ExternalLink, Linkedin } from "lucide-react";

type MentorCardProps = {
  mentor: {
    userId?: string;
    company: string | null;
    title: string | null;
    expertise: string[];
    city: string | null;
    industry: string | null;
    linkedInUrl: string | null;
    isEliteFounder100: boolean;
    profile?: { firstName: string; lastName: string; avatar: string | null } | null;
  };
  score?: number;
  reasons?: string[];
};

export function MentorFriendCard({ mentor, score, reasons }: MentorCardProps) {
  const name = mentor.profile
    ? `${mentor.profile.firstName} ${mentor.profile.lastName}`
    : "Mentor";

  return (
    <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          {mentor.userId ? (
            <Link href={`/mentor/${mentor.userId}`} className="font-semibold text-primary hover:underline">
              {name}
            </Link>
          ) : (
            <h3 className="font-semibold text-primary">{name}</h3>
          )}
          <p className="text-sm text-muted">
            {mentor.title}
            {mentor.company ? ` at ${mentor.company}` : ""}
          </p>
          {score !== undefined && (
            <p className="mt-1 text-xs font-medium text-accent">{score}% match</p>
          )}
        </div>
        <EliteFounderBadge show={mentor.isEliteFounder100} />
      </div>

      {(mentor.city || mentor.industry) && (
        <p className="mt-2 text-xs text-muted">
          {[mentor.city, mentor.industry].filter(Boolean).join(" · ")}
        </p>
      )}

      {mentor.expertise.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {mentor.expertise.slice(0, 4).map((e) => (
            <Badge key={e}>{e}</Badge>
          ))}
        </div>
      )}

      {reasons && reasons.length > 0 && (
        <p className="mt-3 text-xs text-muted">{reasons.join(" · ")}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {mentor.userId && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/mentor/${mentor.userId}`}>View profile</Link>
          </Button>
        )}
        {mentor.linkedInUrl && (
          <Button variant="outline" size="sm" className="gap-1" asChild>
            <a href={mentor.linkedInUrl} target="_blank" rel="noopener noreferrer">
              <Linkedin className="h-3 w-3" />
              LinkedIn
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
