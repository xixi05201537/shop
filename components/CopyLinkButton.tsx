"use client";

import { useState } from "react";

export function CopyLinkButton({
  value,
  label = "复制链接",
  compact = false,
}: {
  value: string;
  label?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button className={compact ? "link-copy-button compact-copy-button" : "link-copy-button"} type="button" onClick={copy}>
      {copied ? "已复制" : label}
    </button>
  );
}
