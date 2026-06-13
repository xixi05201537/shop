"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const messages: Record<string, string> = {
  saved: "保存成功",
  deleted: "删除成功",
  uploaded: "上传成功",
  shipped: "发货邮件已发送",
  batchShipped: "批量发货已处理",
  note: "备注已保存",
};

const toastParams = ["saved", "deleted", "uploaded", "shipped", "batchShipped", "resent", "note", "shipError"];

function resentMessage(value: string | null) {
  if (value === "buyer") return "买家邮件已发送";
  if (value === "admin") return "管理员邮件已发送";
  return null;
}

function shipErrorMessage(value: string | null) {
  if (value === "reship") return "包含已发货订单，请确认后再批量发货";
  if (value === "tracking") return "请填写运单号";
  if (value === "empty") return "请选择需要发货的订单";
  if (value === "paid") return "没有可发货的已支付订单";
  return null;
}

export function AdminToast() {
  const searchParams = useSearchParams();
  const [visibleMessage, setVisibleMessage] = useState<string | null>(null);
  const lastToastKeyRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const resent = searchParams.get("resent");
    const shipError = searchParams.get("shipError");
    const resentText = resentMessage(resent);
    const shipErrorText = shipErrorMessage(shipError);

    let key: string | null = null;
    let message: string | null = null;
    if (resentText) {
      key = `resent:${resent}`;
      message = resentText;
    } else if (shipErrorText) {
      key = `shipError:${shipError}`;
      message = shipErrorText;
    } else {
      for (const [param, text] of Object.entries(messages)) {
        if (searchParams.get(param)) {
          key = param;
          message = text;
          break;
        }
      }
    }

    if (!message || key === lastToastKeyRef.current) return;
    lastToastKeyRef.current = key;
    setVisibleMessage(message);
    const url = new URL(window.location.href);
    for (const param of toastParams) url.searchParams.delete(param);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setVisibleMessage(null), 3200);
  }, [searchParams]);

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
