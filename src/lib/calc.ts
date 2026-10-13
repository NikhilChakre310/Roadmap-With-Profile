// Pure progress calculations. All numbers derive from stored records only.

export function isSafeUrl(v: string | null | undefined): boolean {
  if (!v) return true;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function localDay(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function addDays(day: string, n: number): string {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Streaks from days with at least one recorded session of >0 minutes. */
export function streaks(activeDays: string[], today: string): { current: number; longest: number } {
  const set = new Set(activeDays);
  const sorted = [...set].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  // Current streak: counts back from today; if today has nothing yet, from yesterday.
  let cursor = set.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}

export function pct(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

/** A milestone can be completed only when all mandatory criteria are checked and the user confirms. */
export function canCompleteMilestone(
  mandatoryIds: string[],
  checked: Set<string>,
  confirmed: boolean,
): boolean {
  return confirmed && mandatoryIds.every((id) => checked.has(id));
}

/** Month progress: 70% topic completion, 30% milestone mandatory criteria. */
export function monthProgress(
  topicsDone: number,
  topicsTotal: number,
  critDone: number,
  critTotal: number,
): number {
  const t = topicsTotal ? topicsDone / topicsTotal : 0;
  const c = critTotal ? critDone / critTotal : 0;
  return Math.round((t * 0.7 + c * 0.3) * 100);
}

export function weekStart(day: string): string {
  const d = new Date(day + "T00:00:00Z");
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  return addDays(day, -dow);
}

export { addDays };
