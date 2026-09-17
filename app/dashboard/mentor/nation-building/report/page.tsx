"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS, BADGE_META } from "@/lib/nation-building";
import type { ImpactKpisDTO, SectionSummaryDTO } from "@/lib/nation-building";
import type { NationBuildingBadge, NationBuildingCategory } from "@/lib/db/types";

type ReportStory = {
  id: string;
  title: string;
  testimonial: string | null;
  description: string | null;
};

type ReportData = {
  year: number;
  mentorName: string;
  kpis: ImpactKpisDTO;
  composite: number;
  sections: SectionSummaryDTO[];
  stories: ReportStory[];
  badges: NationBuildingBadge[];
  availableYears: number[];
};

const KPI_LABELS: { key: keyof ImpactKpisDTO; label: string }[] = [
  { key: "peopleImpacted", label: "People Impacted" },
  { key: "careersTransformed", label: "Careers Transformed" },
  { key: "opportunitiesCreated", label: "Opportunities Created" },
  { key: "volunteerHours", label: "Volunteer Hours" },
];

export default function NationBuildingReportPage() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [data, setData] = useState<ReportData | null>(null);

  const load = useCallback((y: number) => {
    fetch(`/api/mentor/nation-building/report?year=${y}`)
      .then((r) => r.json())
      .then(setData);
  }, []);

  useEffect(() => {
    load(year);
  }, [year, load]);

  if (!data) {
    return <div className="h-64 animate-pulse rounded-xl bg-primary/5" />;
  }

  const years = data.availableYears.length > 0 ? data.availableYears : [year];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/mentor/nation-building">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <select
            className="flex h-10 rounded-sm border border-primary/15 bg-white px-3 text-sm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <Button variant="accent" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" /> Save as PDF
          </Button>
        </div>
      </div>

      <div className="space-y-6 rounded-xl border border-primary/8 bg-white p-8 shadow-card print:border-0 print:shadow-none">
        <div className="border-b border-primary/8 pb-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Impact Score Report
          </p>
          <h1 className="mt-1 text-2xl font-bold text-primary">{data.mentorName}</h1>
          <p className="mt-1 text-sm text-muted">Year {data.year}</p>
          <p className="mt-3 text-3xl font-bold text-accent">
            Impact Score {data.composite.toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {KPI_LABELS.map(({ key, label }) => (
            <div key={key} className="rounded-lg bg-primary/[0.03] p-4 text-center">
              <p className="text-2xl font-bold text-primary">{data.kpis[key]}</p>
              <p className="mt-1 text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>

        {data.badges.length > 0 && (
          <div>
            <h2 className="mb-2 font-semibold text-primary">Badges earned</h2>
            <div className="flex flex-wrap gap-2">
              {data.badges.map((b) => (
                <span
                  key={b}
                  className="rounded-sm bg-accent/15 px-3 py-1 text-sm font-semibold text-accent"
                >
                  {BADGE_META[b].label}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-2 font-semibold text-primary">Contribution breakdown</h2>
          <ul className="divide-y divide-primary/8">
            {data.sections
              .filter((s) => s.verifiedCount > 0 || s.verifiedQuantity > 0)
              .map((s) => (
                <li key={s.category} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-primary">
                    {CATEGORY_LABELS[s.category as NationBuildingCategory]}
                  </span>
                  <span className="font-semibold text-primary">{s.verifiedQuantity}</span>
                </li>
              ))}
            {data.sections.every((s) => s.verifiedQuantity === 0 && s.verifiedCount === 0) && (
              <li className="py-2 text-sm text-muted">No verified contributions for this year.</li>
            )}
          </ul>
        </div>

        {data.stories.length > 0 && (
          <div>
            <h2 className="mb-2 font-semibold text-primary">Featured stories</h2>
            <div className="space-y-3">
              {data.stories.map((story) => (
                <div key={story.id} className="rounded-lg bg-primary/[0.03] p-4">
                  <p className="font-semibold text-primary">{story.title}</p>
                  {story.description && (
                    <p className="mt-1 text-sm text-muted">{story.description}</p>
                  )}
                  {story.testimonial && (
                    <p className="mt-2 text-sm italic text-primary/80">“{story.testimonial}”</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
