import {
  HeartHandshake,
  TrendingUp,
  Rocket,
  GraduationCap,
  Briefcase,
  Trophy,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BADGE_META } from "@/lib/nation-building";
import type { NationBuildingBadge } from "@/lib/db/types";

const BADGE_ICONS: Record<NationBuildingBadge, LucideIcon> = {
  COMMUNITY_MENTOR: HeartHandshake,
  CAREER_CATALYST: TrendingUp,
  STARTUP_ENABLER: Rocket,
  EDUCATION_CHAMPION: GraduationCap,
  OPPORTUNITY_CREATOR: Briefcase,
  NATION_BUILDER: Trophy,
};

const BADGE_ORDER = Object.keys(BADGE_META) as NationBuildingBadge[];

export function NationBuildingBadgeRow({
  earned,
}: {
  earned: NationBuildingBadge[];
}) {
  const earnedSet = new Set(earned);

  return (
    <div>
      <h2 className="mb-3 font-semibold text-primary">Badges</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BADGE_ORDER.map((badge) => {
          const Icon = BADGE_ICONS[badge];
          const isEarned = earnedSet.has(badge);
          const meta = BADGE_META[badge];
          return (
            <div
              key={badge}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-4 transition-colors",
                isEarned
                  ? "border-accent/30 bg-accent/5"
                  : "border-primary/8 bg-primary/[0.02] opacity-70"
              )}
            >
              <div
                className={cn(
                  "rounded-lg p-2.5",
                  isEarned ? "bg-accent/20 text-accent" : "bg-primary/5 text-muted"
                )}
              >
                {isEarned ? <Icon className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">{meta.label}</p>
                <p className="mt-0.5 text-xs text-muted">{meta.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
