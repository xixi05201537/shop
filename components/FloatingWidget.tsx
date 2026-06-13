import Link from "next/link";
import type { PublicConfig } from "@/lib/config";

function isSafeFloatingUrl(url: string) {
  if (!url) return false;
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:";
  } catch {
    return false;
  }
}

function isSafeImageUrl(url: string) {
  if (!url) return false;
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function FloatingWidget({ config }: { config: PublicConfig }) {
  if (!config.floatingEnabled) return null;

  const url = config.floatingUrl;
  const imageUrl = config.floatingImageUrl;
  const openInNew = config.floatingOpenMode === "new";

  if (!isSafeFloatingUrl(url)) return null;

  const isExternal = !url.startsWith("/");

  return (
    <Link
      className={`floating-widget float-${config.floatingSize === "small" ? "small" : "medium"} float-${config.floatingPosition}`}
      href={url}
      target={openInNew || isExternal ? "_blank" : undefined}
      rel={openInNew || isExternal ? "noopener noreferrer" : undefined}
      aria-label="Floating link"
    >
      {imageUrl && isSafeImageUrl(imageUrl) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" />
      ) : (
        config.floatingLabel
      )}
    </Link>
  );
}
