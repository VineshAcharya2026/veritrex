"use client";

import { useState } from "react";
import { REACTION_META, REACTION_TYPES, type ReactionType } from "./types";

export function ReactionPicker({
  myReaction,
  onSelect,
  onToggle,
}: {
  myReaction: ReactionType | null;
  onSelect: (type: ReactionType) => void;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const active = myReaction ? REACTION_META[myReaction] : null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {open && (
        <div className="absolute bottom-full left-0 z-20 mb-1 flex gap-0.5 rounded-full border border-primary/10 bg-white p-1.5 shadow-card-hover">
          {REACTION_TYPES.map((type) => {
            const meta = REACTION_META[type];
            return (
              <button
                key={type}
                type="button"
                title={meta.label}
                onClick={() => {
                  onSelect(type);
                  setOpen(false);
                }}
                className="rounded-full px-1.5 py-0.5 text-lg transition-transform hover:scale-125"
              >
                {meta.emoji}
              </button>
            );
          })}
        </div>
      )}
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          myReaction
            ? "bg-accent/10 text-accent"
            : "text-muted hover:bg-primary/5 hover:text-primary"
        }`}
      >
        <span className="text-base leading-none">{active?.emoji ?? "👍"}</span>
        {active?.label ?? "React"}
      </button>
    </div>
  );
}
