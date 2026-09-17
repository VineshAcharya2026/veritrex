import { Users, TrendingUp, Briefcase, Clock, Sparkles } from "lucide-react";
import { StatCard } from "@/components/charts/StatCard";
import type { ImpactKpis } from "@/lib/nation-building-impact";

export function ImpactScoreHeader({
  kpis,
  composite,
}: {
  kpis: ImpactKpis;
  composite: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 rounded-xl border border-accent/20 bg-gradient-to-br from-accent/10 to-transparent p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
            <Sparkles className="h-4 w-4 text-accent" /> Impact Score
          </p>
          <p className="mt-1 text-4xl font-bold text-primary">{composite.toLocaleString()}</p>
          <p className="mt-1 text-sm text-muted">
            A composite of your verified impact contributions.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="People Impacted" value={kpis.peopleImpacted} icon={Users} />
        <StatCard label="Careers Transformed" value={kpis.careersTransformed} icon={TrendingUp} />
        <StatCard label="Opportunities Created" value={kpis.opportunitiesCreated} icon={Briefcase} />
        <StatCard label="Volunteer Hours" value={kpis.volunteerHours} icon={Clock} />
      </div>
    </div>
  );
}
