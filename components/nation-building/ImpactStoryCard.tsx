import { Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NationBuildingEntryDTO } from "@/lib/nation-building";

export function ImpactStoryCard({ story }: { story: NationBuildingEntryDTO }) {
  const image = story.evidenceUrls.find((u) => !u.toLowerCase().endsWith(".pdf"));

  return (
    <div className="overflow-hidden rounded-lg border border-primary/8 bg-white shadow-card">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={story.title} className="h-40 w-full object-cover" />
      )}
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-primary">{story.title}</h3>
          <Badge variant={story.verified ? "accent" : "locked"}>
            {story.verified ? "Verified" : "Pending"}
          </Badge>
        </div>
        {story.description && <p className="text-sm text-muted">{story.description}</p>}
        {story.testimonial && (
          <blockquote className="flex gap-2 rounded-md bg-primary/[0.03] p-3 text-sm italic text-primary/80">
            <Quote className="h-4 w-4 shrink-0 text-accent" />
            <span>{story.testimonial}</span>
          </blockquote>
        )}
      </div>
    </div>
  );
}
