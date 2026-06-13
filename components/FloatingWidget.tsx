import Link from "next/link";
import type { CSSProperties } from "react";
import type { PublicConfig } from "@/lib/config";
import { isSafeFloatingImageUrl, isSafeFloatingUrl } from "@/lib/floating-widgets";

export function FloatingWidget({ config }: { config: PublicConfig }) {
  const widgets = config.floatingWidgets.length
    ? config.floatingWidgets
    : [
        {
          id: "legacy-floating-widget",
          url: config.floatingUrl,
          displayType: "image",
          label: config.floatingLabel,
          imageUrl: config.floatingImageUrl,
          openMode: config.floatingOpenMode,
          size: config.floatingSize,
          width: config.floatingSize === "small" ? 38 : config.floatingSize === "large" ? 88 : 64,
          height: config.floatingSize === "small" ? 38 : config.floatingSize === "large" ? 88 : 64,
          shape: "rounded",
          position: config.floatingPosition,
          enabled: config.floatingEnabled,
          sortOrder: 0,
        },
      ];
  const visibleWidgets = widgets.filter(
    (widget) => widget.enabled && isSafeFloatingUrl(widget.url) && isSafeFloatingImageUrl(widget.imageUrl),
  );

  if (!visibleWidgets.length) return null;

  const positionCounts = new Map<string, number>();

  return visibleWidgets.map((widget) => {
    const offsetIndex = positionCounts.get(widget.position) || 0;
    positionCounts.set(widget.position, offsetIndex + 1);
    const openInNew = widget.openMode === "new";
    const isExternal = !widget.url.startsWith("/");
    const imageUrl = widget.imageUrl;

    return (
      <Link
        className={`floating-widget float-shape-${widget.shape} float-${widget.position}`}
        href={widget.url}
        key={widget.id}
        style={
          {
            "--floating-offset-index": offsetIndex,
            "--floating-width": `${widget.width}px`,
            "--floating-height": `${widget.height}px`,
          } as CSSProperties
        }
        target={openInNew || isExternal ? "_blank" : undefined}
        rel={openInNew || isExternal ? "noopener noreferrer" : undefined}
        aria-label={widget.label || "Floating link"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" />
      </Link>
    );
  });
}
