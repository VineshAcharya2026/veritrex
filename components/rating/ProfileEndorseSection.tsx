import { getSession } from "@/lib/auth";
import { countVerifiedEndorsements, hasEndorsed, isUserVerified } from "@/lib/endorsements";
import { EndorseButton } from "@/components/rating/EndorseButton";

export async function ProfileEndorseSection({ userId }: { userId: string }) {
  const session = await getSession();
  const count = await countVerifiedEndorsements(userId);

  if (!session || session.user.id === userId) {
    return (
      <p className="text-sm text-muted">
        {count} verified endorsement{count !== 1 ? "s" : ""}
      </p>
    );
  }

  const [alreadyEndorsed, viewerHasAvatar] = await Promise.all([
    hasEndorsed(session.user.id, userId),
    isUserVerified(session.user.id),
  ]);

  return (
    <EndorseButton
      userId={userId}
      initialCount={count}
      initialEndorsed={alreadyEndorsed}
      viewerHasAvatar={viewerHasAvatar}
    />
  );
}
