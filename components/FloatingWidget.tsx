import Link from "next/link";
import type { PublicConfig } from "@/lib/config";

export function FloatingWidget({ config }: { config: PublicConfig }) {
  if (!config.floatingEnabled) return null;

  return (
    <Link
      className={`floating-widget float-${config.floatingSize === "small" ? "small" : "medium"} float-${config.floatingPosition}`}
      href={config.floatingUrl}
      target={config.floatingOpenMode === "new" ? "_blank" : undefined}
      aria-label="Floating link"
    >
      {config.floatingImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={config.floatingImageUrl} alt="" />
      ) : (
        config.floatingLabel
      )}
    </Link>
  );
}
