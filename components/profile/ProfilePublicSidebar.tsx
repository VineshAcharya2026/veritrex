import Link from "next/link";
import { MapPin, Building2, MessageSquare } from "lucide-react";
import { ProfileSectionCard } from "@/components/profile/ProfileHeader";
import { ProfileEndorseSection } from "@/components/rating/ProfileEndorseSection";
import { TrustScoreBadge } from "@/components/rating/TrustScoreBadge";

export function ProfilePublicSidebar({
  userId,
  tier,
  location,
  industry,
  roleLabel,
}: {
  userId: string;
  tier: string;
  location?: string | null;
  industry?: string | null;
  roleLabel: string;
}) {
  return (
    <>
      <ProfileSectionCard title="Connect">
        <div className="space-y-4">
          <TrustScoreBadge tier={tier} />
          <ProfileEndorseSection userId={userId} />
          <Link
            href="/dashboard/messages"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
          >
            <MessageSquare className="h-4 w-4" />
            Message
          </Link>
        </div>
      </ProfileSectionCard>

      <ProfileSectionCard title="About">
        <ul className="space-y-2 text-sm text-muted">
          <li className="text-primary/80">{roleLabel}</li>
          {location && (
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              {location}
            </li>
          )}
          {industry && (
            <li className="flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0" />
              {industry}
            </li>
          )}
        </ul>
      </ProfileSectionCard>
    </>
  );
}
