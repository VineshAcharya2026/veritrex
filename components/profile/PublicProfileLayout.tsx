import type { ReactNode } from "react";

export function PublicProfileLayout({
  header,
  main,
  sidebar,
}: {
  header: ReactNode;
  main: ReactNode;
  sidebar: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f3f2ef]">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        {header}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">{main}</div>
          <aside className="space-y-4">{sidebar}</aside>
        </div>
      </div>
    </div>
  );
}
