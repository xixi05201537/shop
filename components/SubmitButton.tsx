"use client";

import { useEffect, useState } from "react";
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

  /* eslint-disable react-hooks/set-state-in-effect */
  // Intentionally reset the optimistic "clicked" state once the form action finishes.
  useEffect(() => {
    if (!pending && clicked) {
      setClicked(false);
    }
  }, [pending, clicked]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
