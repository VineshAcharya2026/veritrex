"use client";

import { Star } from "lucide-react";

export function StarDimensionInput({
  label,
  weight,
  value,
  onChange,
}: {
  label: string;
  weight: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-primary">{label}</span>
        <span className="text-xs text-muted">{weight}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${
                n <= value
                  ? "fill-amber-400 text-amber-400"
                  : "text-primary/20"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
