"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const messages: Record<string, string> = {
  saved: "保存成功",
  deleted: "删除成功",
  uploaded: "上传成功",
  shipped: "发货邮件已发送",
  note: "备注已保存",
};

const toastParams = ["saved", "deleted", "uploaded", "shipped", "resent", "note"];

function resentMessage(value: string | null) {
  if (value === "buyer") return "买家邮件已发送";
  if (value === "admin") return "管理员邮件已发送";
  return null;
}

export function AdminToast() {
  const searchParams = useSearchParams();
  const toast = useMemo(() => {
    const resent = searchParams.get("resent");
    const resentText = resentMessage(resent);
    if (resentText) return { key: `resent:${resent}`, message: resentText };

    for (const [key, text] of Object.entries(messages)) {
      if (searchParams.get(key)) return { key, message: text };
    }

    return null;
  }, [searchParams]);
  const [visibleMessage, setVisibleMessage] = useState<string | null>(null);
  const lastToastKeyRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!toast || toast.key === lastToastKeyRef.current) return;
    lastToastKeyRef.current = toast.key;
    setVisibleMessage(toast.message);
    const url = new URL(window.location.href);
    for (const key of toastParams) url.searchParams.delete(key);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setVisibleMessage(null), 3200);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  if (!visibleMessage) return null;

  return (
    <div className="admin-toast" role="status" aria-live="polite">
      <CheckCircle2 size={18} />
      <span>{visibleMessage}</span>
    </div>
  );
}
