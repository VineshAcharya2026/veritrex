import { cn } from "@/lib/utils";
import { BRAND, BRAND_ASSETS, WORDMARK_ASPECT, LOCKUP_ASPECT } from "@/lib/brand";

/** The Veritrex icon mark (teal/gold V nodes) on black. */
export function LogoMark({
  size = 40,
  rounded = "rounded-lg",
  className,
  priority,
}: {
  size?: number;
  rounded?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      src={BRAND_ASSETS.mark[192]}
      alt={`${BRAND.name} icon`}
      width={size}
      height={size}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={cn("block shrink-0 object-contain", rounded, className)}
      style={{ width: size, height: size }}
    />
  );
}

/** Full Veritrex logo lockup (icon + wordmark + tagline) on black. */
export function LogoLockup({
  width,
  height,
  className,
  rounded = "rounded-xl",
  priority,
  shadowed = false,
}: {
  /** Width in px — omit when `height` is set. */
  width?: number;
  /** Height in px — preferred for auth/hero layouts so the tagline stays readable. */
  height?: number;
  className?: string;
  rounded?: string;
  priority?: boolean;
  shadowed?: boolean;
}) {
  const resolvedHeight = height ?? Math.round((width ?? 320) / LOCKUP_ASPECT);
  const resolvedWidth = height ? Math.round(height * LOCKUP_ASPECT) : (width ?? 320);
  const src =
    resolvedWidth >= 900
      ? BRAND_ASSETS.lockup[1200]
      : resolvedWidth >= 600
        ? BRAND_ASSETS.lockup[800]
        : BRAND_ASSETS.lockup[480];

  return (
    <img
      src={src}
      alt={`${BRAND.name} — ${BRAND.tagline}`}
      width={resolvedWidth}
      height={resolvedHeight}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={cn(
        "block w-auto shrink-0 object-contain object-left",
        shadowed && "shadow-card-hover",
        rounded,
        className
      )}
      style={{ height: resolvedHeight, width: "auto", maxWidth: resolvedWidth }}
    />
  );
}

/**
 * Icon + "VERITREX" wordmark — use in nav bars and sidebars (no tagline).
 * Height-driven sizing keeps headers compact.
 */
export function LogoWordmark({
  height = 36,
  className,
  priority,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const width = Math.round(height * WORDMARK_ASPECT);
  const src =
    height >= 54
      ? BRAND_ASSETS.wordmark[720]
      : height >= 36
        ? BRAND_ASSETS.wordmark[480]
        : BRAND_ASSETS.wordmark[320];

  return (
    <img
      src={src}
      alt={BRAND.name}
      width={width}
      height={height}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={cn("block shrink-0 object-contain object-left", className)}
      style={{ height, width: "auto", maxWidth: width }}
    />
  );
}

/** Compact header logo: icon on xs screens, wordmark from sm up. */
export function LogoNav({
  height = 34,
  className,
  priority,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const markSize = Math.max(28, height - 4);
  return (
    <>
      <LogoMark
        size={markSize}
        rounded="rounded-md"
        priority={priority}
        className={cn("sm:hidden", className)}
      />
      <LogoWordmark
        height={height}
        priority={priority}
        className={cn("hidden sm:block", className)}
      />
    </>
  );
}
