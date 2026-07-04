import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

const TIER_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  EMERGING: {
    label: "Emerging",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-300",
  },
  ESTABLISHED: {
    label: "Established",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-300",
  },
  RECOGNISED: {
    label: "Recognised",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-300",
  },
  DISTINGUISHED: {
    label: "Distinguished",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-400",
  },
};

export function TrustScoreBadge({
  tier,
  score,
  size = "sm",
}: {
  tier: string;
  score?: number;
  size?: "sm" | "lg";
}) {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.EMERGING;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        config.bg,
        config.text,
        config.border,
        size === "lg" ? "px-4 py-1.5 text-sm" : "px-2.5 py-0.5 text-xs"
      )}
    >
      <Shield className={size === "lg" ? "h-4 w-4" : "h-3 w-3"} />
      {config.label}
      {score !== undefined && (
        <span className="opacity-60">({score})</span>
      )}
    </span>
  );
}
