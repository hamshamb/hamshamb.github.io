"use client";

import { useLocalTime } from "@/lib/client-stores";
import { owner } from "@/content/site";

export function LocalTime({ withZone = true }: { withZone?: boolean }) {
  const time = useLocalTime();
  return (
    <time suppressHydrationWarning aria-label={`local time ${time} ${owner.timeZoneLabel}`}>
      {time}
      {withZone ? ` ${owner.timeZoneLabel}` : null}
    </time>
  );
}
