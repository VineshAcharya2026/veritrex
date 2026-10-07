"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { CalendarLinkSet } from "@/lib/calendar/add-links";

type Props = {
  sessionId: string;
  links?: CalendarLinkSet | null;
  compact?: boolean;
};

export function CalendarLinkButtons({ sessionId, links: initialLinks, compact }: Props) {
  const [links, setLinks] = useState<CalendarLinkSet | null>(initialLinks ?? null);

  useEffect(() => {
    if (initialLinks) setLinks(initialLinks);
  }, [initialLinks]);

  useEffect(() => {
    if (links?.google) return;
    fetch(`/api/sessions/${sessionId}/calendar/links`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.google) setLinks(data as CalendarLinkSet);
      })
      .catch(() => {});
  }, [sessionId, links?.google]);

  const icsHref = links?.icsDownloadPath ?? `/api/sessions/${sessionId}/calendar`;
  const btn = compact ? "sm" : "sm";

  return (
    <div className="flex flex-wrap gap-2">
      {links?.google && (
        <Button size={btn} variant="outline" asChild>
          <a href={links.google} target="_blank" rel="noopener noreferrer">
            Google Calendar
          </a>
        </Button>
      )}
      {links?.outlook && (
        <Button size={btn} variant="outline" asChild>
          <a href={links.outlook} target="_blank" rel="noopener noreferrer">
            Outlook
          </a>
        </Button>
      )}
      <Button size={btn} variant="outline" asChild>
        <Link href={icsHref} target="_blank" rel="noopener noreferrer">
          Download .ics
        </Link>
      </Button>
    </div>
  );
}
