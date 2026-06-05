"use client";

import { useState } from "react";
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
  const [clicked, setClicked] = useState(false);
  const loading = pending || clicked;

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    window.requestAnimationFrame(() => {
      if (!form || form.checkValidity()) setClicked(true);
    });
  }

  return (
    <button className={`${className} ${loading ? "is-loading" : ""}`} type="submit" disabled={loading} onClick={handleClick}>
      {loading ? (
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
