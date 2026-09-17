import { FeedTimeline } from "@/components/feed/FeedTimeline";
import type { FeedProfileCardData } from "@/components/feed/FeedProfileCard";
import { SocialPageFrame } from "@/components/layout/SocialPageFrame";

export function FeedPageShell({
  profile,
  currentUserId,
  authorName,
  authorAvatar,
  role,
}: {
  profile: FeedProfileCardData;
  currentUserId: string;
  authorName: string;
  authorAvatar: string | null;
  role: "MENTOR" | "MENTEE";
}) {
  return (
    <SocialPageFrame role={role} profile={profile}>
      <FeedTimeline
        currentUserId={currentUserId}
        authorName={authorName}
        authorAvatar={authorAvatar}
      />
    </SocialPageFrame>
  );
}
