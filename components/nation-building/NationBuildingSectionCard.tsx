"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContributionForm } from "@/components/nation-building/ContributionForm";
import {
  NATION_BUILDING_CATEGORIES,
  type NationBuildingEntryDTO,
  type SectionSummaryDTO,
} from "@/lib/nation-building";
import type { NationBuildingCategory } from "@/lib/db/types";

export function NationBuildingSectionCard({
  category,
  summary,
  entries,
  onChanged,
}: {
  category: NationBuildingCategory;
  summary: SectionSummaryDTO;
  entries: NationBuildingEntryDTO[];
  onChanged: () => void;
}) {
  const meta = NATION_BUILDING_CATEGORIES.find((c) => c.category === category)!;
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function remove(id: string) {
    await fetch(`/api/mentor/nation-building/entries/${id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="rounded-lg border border-primary/8 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-primary">{meta.label}</h3>
          <p className="mt-0.5 text-xs text-muted">{meta.description}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{summary.verifiedQuantity}</p>
          <p className="text-[11px] uppercase tracking-wider text-muted">verified {meta.unit}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {summary.pendingCount > 0 && (
          <Badge variant="locked">{summary.pendingCount} pending</Badge>
        )}
        {entries.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "Hide" : `View ${entries.length}`}
          </button>
        )}
        {!adding && (
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => setAdding(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add contribution
          </Button>
        )}
      </div>

      {expanded && entries.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-primary/8 pt-3">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-primary">
                {e.title}
                {e.quantity ? ` · ${e.quantity}` : ""}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant={e.verified ? "accent" : "locked"}>
                  {e.verified ? "Verified" : "Pending"}
                </Badge>
                {e.source === "MANUAL" && (
                  <button
                    type="button"
                    onClick={() => remove(e.id)}
                    className="text-muted hover:text-red-600"
                    aria-label="Delete contribution"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <div className="mt-3">
          <ContributionForm
            category={category}
            onSaved={() => {
              setAdding(false);
              onChanged();
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}
    </div>
  );
}
