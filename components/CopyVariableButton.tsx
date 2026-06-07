"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyVariableButton({ value, important = false }: { value: string; important?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      className={`template-variable-button${important ? " is-important" : ""}${copied ? " is-copied" : ""}`}
      type="button"
      onClick={handleCopy}
      title={`复制 ${value}`}
      aria-label={`复制变量 ${value}`}
    >
      <span>{value}</span>
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}
