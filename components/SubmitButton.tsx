"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  loadingText = "处理中...",
  className = "admin-button",
}: {
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={`${className} ${pending ? "is-loading" : ""}`} type="submit" disabled={pending}>
      {pending ? (
        <>
          <span className="button-spinner" aria-hidden="true" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
