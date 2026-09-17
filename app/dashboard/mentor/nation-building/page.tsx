"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ImpactScoreHeader } from "@/components/nation-building/ImpactScoreHeader";
import { NationBuildingBadgeRow } from "@/components/nation-building/NationBuildingBadgeRow";
import { NationBuildingSectionCard } from "@/components/nation-building/NationBuildingSectionCard";
import { ImpactStoryCard } from "@/components/nation-building/ImpactStoryCard";
import { ContributionForm } from "@/components/nation-building/ContributionForm";
import { NATION_BUILDING_CATEGORIES, MAX_IMPACT_STORIES } from "@/lib/nation-building";
import type {
  ImpactKpisDTO,
  NationBuildingEntryDTO,
  SectionSummaryDTO,
} from "@/lib/nation-building";
import type { NationBuildingBadge, NationBuildingCategory } from "@/lib/db/types";

type NationBuildingData = {
  kpis: ImpactKpisDTO;
  composite: number;
  sections: SectionSummaryDTO[];
  entries: NationBuildingEntryDTO[];
  badges: { badge: NationBuildingBadge; earnedAt: string }[];
};

const NON_STORY_CATEGORIES = NATION_BUILDING_CATEGORIES.filter(
  (c) => c.category !== "IMPACT_STORY"
);

export default function NationBuildingPage() {
  const [data, setData] = useState<NationBuildingData | null>(null);
  const [addingStory, setAddingStory] = useState(false);

  const load = useCallback(() => {
    fetch("/api/mentor/nation-building")
      .then((r) => r.json())
      .then(setData);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return <div className="h-64 animate-pulse rounded-xl bg-primary/5" />;
  }

  const entriesByCategory = (category: NationBuildingCategory) =>
    data.entries.filter((e) => e.category === category);
  const summaryFor = (category: NationBuildingCategory) =>
    data.sections.find((s) => s.category === category) ?? {
      category,
      verifiedCount: 0,
      verifiedQuantity: 0,
      pendingCount: 0,
    };

  const stories = entriesByCategory("IMPACT_STORY");

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Impact Score"
          description="Track the verified social impact you create. Verified contributions grow your Impact Score, earn badges, and feature you on the public leaderboard."
        />
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/mentor/nation-building/report">
              <FileText className="mr-1 h-4 w-4" /> Annual report
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/leaderboard">
              <Trophy className="mr-1 h-4 w-4" /> Leaderboard
            </Link>
          </Button>
        </div>
      </div>

      <ImpactScoreHeader kpis={data.kpis} composite={data.composite} />

      <NationBuildingBadgeRow earned={data.badges.map((b) => b.badge)} />

      <div>
        <h2 className="mb-3 font-semibold text-primary">Contributions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {NON_STORY_CATEGORIES.map(({ category }) => (
            <NationBuildingSectionCard
              key={category}
              category={category}
              summary={summaryFor(category)}
              entries={entriesByCategory(category)}
              onChanged={load}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-primary">Impact stories</h2>
            <p className="text-xs text-muted">
              Up to {MAX_IMPACT_STORIES} stories with photos, documents and testimonials.
            </p>
          </div>
          {!addingStory && stories.length < MAX_IMPACT_STORIES && (
            <Button size="sm" variant="accent" onClick={() => setAddingStory(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add story
            </Button>
          )}
        </div>

        {addingStory && (
          <div className="mb-4">
            <ContributionForm
              category="IMPACT_STORY"
              onSaved={() => {
                setAddingStory(false);
                load();
              }}
              onCancel={() => setAddingStory(false)}
            />
          </div>
        )}

        {stories.length === 0 ? (
          <p className="rounded-xl border border-primary/8 bg-white p-5 text-sm text-muted shadow-card">
            No impact stories yet. Share a memorable moment from your mentoring journey.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <ImpactStoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
