"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyVariableButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setError(false);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
      setError(true);
      window.setTimeout(() => setError(false), 1200);
    }
  }

  return (
    <button
      className={`template-variable-button${copied ? " is-copied" : ""}${error ? " is-error" : ""}`}
      type="button"
      onClick={handleCopy}
      title={`复制 ${value}`}
      aria-label={`复制变量 ${value}`}
    >
      <span>{value}</span>
      {copied ? <Check size={13} /> : error ? <span className="copy-error-mark">!</span> : <Copy size={13} />}
    </button>
  );
}
