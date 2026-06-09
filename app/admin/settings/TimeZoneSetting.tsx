"use client";

import { useMemo, useState } from "react";
import {
  DISPLAY_TIME_ZONE_OPTIONS,
  formatDateTimeWithOffset,
  normalizeDisplayTimeZone,
} from "@/lib/format";

type TimeZoneSettingProps = {
  defaultValue: string;
};

const previewDate = new Date("2026-06-09T05:39:08.292Z");

export function TimeZoneSetting({ defaultValue }: TimeZoneSettingProps) {
  const [timeZone, setTimeZone] = useState(normalizeDisplayTimeZone(defaultValue));
  const preview = useMemo(() => formatDateTimeWithOffset(previewDate, timeZone), [timeZone]);

  return (
    <div className="settings-time-zone-row">
      <label>
        默认显示时区
        <select name="displayTimeZone" value={timeZone} onChange={(event) => setTimeZone(event.target.value)}>
          {DISPLAY_TIME_ZONE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} ({option.value})
            </option>
          ))}
        </select>
      </label>
      <div className="settings-time-zone-preview" aria-live="polite">
        <span>预览：</span>
        <strong>{preview}</strong>
      </div>
    </div>
  );
}
