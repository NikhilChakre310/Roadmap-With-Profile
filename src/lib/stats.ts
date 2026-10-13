import { MILESTONES, MONTHS, TOPICS, TOTAL_SLOTS } from "@/data/catalog";
import { addDays, localDay, monthProgress, pct, streaks, weekStart } from "./calc";
import { useRows, useSettings } from "./data";

export const HEAT = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"];
export const heatLevel = (min: number) =>
  min <= 0 ? 0 : min < 30 ? 1 : min < 90 ? 2 : min < 180 ? 3 : 4;

export function useStats() {
  const { settings } = useSettings();
  const sessions = useRows("study_sessions").data ?? [];
  const progress = useRows("topic_progress").data ?? [];
  const subs = useRows("topic_submissions").data ?? [];
  const mprog = useRows("milestone_progress").data ?? [];
  const checks = useRows("criterion_checks").data ?? [];
  const problems = useRows("dsa_problems").data ?? [];
  const repos = useRows("github_repos").data ?? [];

  const today = localDay(new Date(), settings.timezone);
  const byDay = new Map<string, number>();
  for (const s of sessions) byDay.set(s.date, (byDay.get(s.date) ?? 0) + s.minutes);
  const activeDays = [...byDay.entries()].filter(([, m]) => m > 0).map(([d]) => d);
  const st = streaks(activeDays, today);
  const totalMinutes = sessions.reduce((a, s) => a + s.minutes, 0);
  const ws = weekStart(today);
  const weekMinutes = sessions
    .filter((s) => s.date >= ws && s.date <= today)
    .reduce((a, s) => a + s.minutes, 0);
  const todayMinutes = byDay.get(today) ?? 0;

  const pmap = new Map(progress.map((p) => [p.topic_id, p]));
  const completed = progress.filter((p) => p.status === "Completed").length;
  const needsRevision = progress.filter((p) => p.status === "Needs Revision").length;
  const checked = new Set(checks.map((c) => c.criterion_id));
  const milestonesDone = mprog.filter((m) => m.status === "Completed").length;

  const months = MONTHS.map((m) => {
    const ts = TOPICS.filter((t) => t.monthId === m.id);
    const done = ts.filter((t) => pmap.get(t.id)?.status === "Completed").length;
    const mand = MILESTONES[m.id - 1]!.criteria.filter((c) => c.kind === "mandatory");
    const cd = mand.filter((c) => checked.has(c.id)).length;
    return {
      ...m,
      total: ts.length,
      done,
      critTotal: mand.length,
      critDone: cd,
      progress: monthProgress(done, ts.length, cd, mand.length),
    };
  });

  const filledSlots = subs.filter((s) => s.repo_url || s.live_url || s.demo_url).length;
  const completedSlots = subs.filter((s) => s.status === "Completed").length;
  const solved = problems.filter((p) => p.status === "Solved");

  const last = (n: number) =>
    Array.from({ length: n }, (_, i) => {
      const d = addDays(today, i - n + 1);
      return { date: d, minutes: byDay.get(d) ?? 0 };
    });

  return {
    settings,
    today,
    sessions,
    progress,
    pmap,
    subs,
    mprog,
    checked,
    problems,
    repos,
    byDay,
    last,
    streak: st,
    totalMinutes,
    weekMinutes,
    todayMinutes,
    completed,
    needsRevision,
    topicsTotal: TOPICS.length,
    topicPct: pct(completed, TOPICS.length),
    milestonesDone,
    months,
    overall: Math.round(months.reduce((a, m) => a + m.progress, 0) / months.length),
    totalSlots: TOTAL_SLOTS,
    filledSlots,
    completedSlots,
    solved,
    dailyPct: pct(todayMinutes, settings.daily_goal_minutes),
  };
}

/** Current month index from start date (1..8), or 1 if no start date configured. */
export function currentMonth(start: string | null, today: string) {
  if (!start) return 1;
  const days = (new Date(today).getTime() - new Date(start).getTime()) / 86400000;
  return Math.min(8, Math.max(1, Math.floor(days / 30) + 1));
}
