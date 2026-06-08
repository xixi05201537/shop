"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";

type AmountTagEditorProps = {
  amounts: string;
  defaultAmount: number;
};

export function AmountTagEditor({ amounts, defaultAmount }: AmountTagEditorProps) {
  const initialAmounts = useMemo(() => parseInitialAmounts(amounts), [amounts]);
  const [values, setValues] = useState(initialAmounts.length ? initialAmounts : [1, 10, 30, 50]);
  const [defaultValue, setDefaultValue] = useState(defaultAmount);
  const [draft, setDraft] = useState("");
  const normalizedDefault = values.some((item) => Math.abs(item - defaultValue) < 0.001) ? defaultValue : values[0] || 1;

  function commitValues(nextValues: number[], nextDefault = normalizedDefault) {
    const unique = [...new Set(nextValues.map((item) => Number(item.toFixed(2))))].filter((item) => item > 0).sort((a, b) => a - b);
    if (!unique.length) return;
    setValues(unique);
    setDefaultValue(unique.some((item) => Math.abs(item - nextDefault) < 0.001) ? nextDefault : unique[0]);
  }

  function addAmount() {
    const amount = Number(draft);
    if (!Number.isFinite(amount) || amount <= 0) return;
    commitValues([...values, amount]);
    setDraft("");
  }

  return (
    <div className="amount-tag-editor">
      <input name="enabledAmounts" type="hidden" value={values.join(",")} />
      <input name="defaultAmount" type="hidden" value={normalizedDefault} />
      <div className="amount-tag-row">
        <div className="amount-tag-list">
          {values.map((amount) => {
            const isDefault = Math.abs(amount - normalizedDefault) < 0.001;
            return (
              <button
                className={isDefault ? "amount-admin-tag is-default" : "amount-admin-tag"}
                key={amount}
                type="button"
                onClick={() => setDefaultValue(amount)}
              >
                <span>${formatAmount(amount)}</span>
                <small>{isDefault ? "默认" : "设默认"}</small>
                <span
                  className="amount-tag-remove"
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    commitValues(values.filter((item) => Math.abs(item - amount) >= 0.001));
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      commitValues(values.filter((item) => Math.abs(item - amount) >= 0.001));
                    }
                  }}
                  aria-label={`删除金额 ${formatAmount(amount)}`}
                >
                  <X size={13} />
                </span>
              </button>
            );
          })}
        </div>
        <div className="amount-add-row">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addAmount();
              }
            }}
            inputMode="decimal"
            placeholder="新增金额，例如 20"
            type="number"
            min="0.01"
            step="0.01"
          />
          <button className="secondary-button" type="button" onClick={addAmount}>
            <Plus size={16} /> 添加金额
          </button>
        </div>
      </div>
      <p className="admin-help">点击金额标签可设为默认；点标签右侧的小叉可删除。</p>
    </div>
  );
}

function parseInitialAmounts(value: string) {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(Number).filter((item) => Number.isFinite(item) && item > 0);
  } catch {
    return value
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item) && item > 0);
  }
  return [];
}

function formatAmount(value: number) {
  return value.toFixed(2).replace(/\.00$/, "");
}
