import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar as RBar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2, Circle, Flame } from "lucide-react";
import { Bar, Empty, PageHeader, Stat } from "@/components/AppShell";
import { MILESTONES, topicById } from "@/data/catalog";
import { addDays, weekStart } from "@/lib/calc";
import { meta } from "@/lib/meta";
import { currentMonth, HEAT, heatLevel, useStats } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { Heatmap } from "@/components/Heatmap";

export const Route = createFileRoute("/")({
  head: () =>
    meta("Dashboard", "Your daily learning, projects, streaks and roadmap progress at a glance."),
  component: Dashboard,
});

const h = (m: number) => `${(m / 60).toFixed(1)}h`;

function Dashboard() {
  const s = useStats();
  const cm = currentMonth(s.settings.start_date, s.today);
  const month = s.months[cm - 1]!;
  const ms = MILESTONES[cm - 1]!;
  const msProg = s.mprog.find((m) => m.milestone_id === ms.id);
  const todaySessions = s.sessions.filter((x) => x.date === s.today);
  const catMin = (c: string) =>
    todaySessions.filter((x) => x.category === c).reduce((a, x) => a + x.minutes, 0);
  const checklist = [
    { label: "DSA practice", done: catMin("DSA Practice"), target: s.settings.dsa_target_minutes },
    {
      label: "Learning",
      done:
        catMin("Learning or Video Lessons") + catMin("Documentation Reading") + catMin("Revision"),
      target: s.settings.learning_target_minutes,
    },
    {
      label: "Project building",
      done: catMin("Project Development"),
      target: s.settings.project_target_minutes,
    },
  ];
  const chart = s
    .last(14)
    .map((d) => ({ day: d.date.slice(5), hours: +(d.minutes / 60).toFixed(2) }));
  const weekly = Array.from({ length: 8 }, (_, i) => {
    const ws = addDays(weekStart(s.today), (i - 7) * 7);
    const we = addDays(ws, 6);
    const m = s.sessions
      .filter((x) => x.date >= ws && x.date <= we)
      .reduce((a, x) => a + x.minutes, 0);
    return { week: ws.slice(5), hours: +(m / 60).toFixed(1) };
  });
  const recent = [...s.sessions]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);
  const revision = s.progress
    .filter(
      (p) =>
        p.status === "Needs Revision" ||
        (p.next_revision && p.next_revision <= addDays(s.today, 7)),
    )
    .slice(0, 6);
  const deadlines = s.mprog
    .filter((m) => m.deadline && m.status !== "Completed" && m.deadline >= s.today)
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        sub={`Month ${cm} · ${month.title}${s.settings.start_date ? "" : " (set your start date in Settings)"}`}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <Stat label="Milestones" value={`${s.milestonesDone} / 8`} />
        <Stat
          label="Topics"
          value={`${s.topicPct}%`}
          hint={`${s.completed} done · ${s.needsRevision} revise`}
        />
        <Stat
          label="Focused hours"
          value={h(s.totalMinutes)}
          hint={`${h(s.weekMinutes)} this week`}
        />
        <Stat
          label="Streak"
          value={
            <span className="flex items-center gap-1.5">
              <Flame className="h-5 w-5 text-warning" />
              {s.streak.current}d
            </span>
          }
          hint={`Longest ${s.streak.longest}d`}
        />
        <Stat
          label="Submissions"
          value={`${s.filledSlots}`}
          hint={`of ${s.totalSlots} slots · ${s.completedSlots} completed`}
        />
        <Stat label="DSA solved" value={s.solved.length} hint={`${s.repos.length} repos linked`} />
      </div>

      <div className="panel p-5">
        <div className="mb-2 flex justify-between text-sm">
          <span>Overall roadmap</span>
          <span className="font-mono">{s.overall}%</span>
        </div>
        <Bar value={s.overall} />
        <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
          {s.months.map((m) => (
            <Link
              key={m.id}
              to="/roadmap"
              className={cn(
                "rounded-md border p-2.5 transition-colors hover:bg-accent",
                m.id === cm && "border-primary",
              )}
            >
              <div className="stat-label">M{m.id}</div>
              <div className="mt-1 line-clamp-2 text-xs font-medium">{m.title}</div>
              <Bar value={m.progress} className="mt-2" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5">
          <div className="mb-3 flex justify-between">
            <h3 className="font-semibold">Today</h3>
            <span className="font-mono text-sm text-muted-foreground">
              {s.todayMinutes}/{s.settings.daily_goal_minutes} min
            </span>
          </div>
          <Bar value={s.dailyPct} />
          <ul className="mt-4 space-y-2.5">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2 text-sm">
                {c.done >= c.target ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="flex-1">{c.label}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {c.done}/{c.target}m
                </span>
              </li>
            ))}
          </ul>
          <Link to="/daily" className="mt-4 inline-block text-sm text-primary hover:underline">
            Log a session →
          </Link>
        </div>
        <div className="panel p-5 lg:col-span-2">
          <h3 className="mb-3 font-semibold">Daily hours · last 14 days</h3>
          <div className="h-44">
            <ResponsiveContainer>
              <BarChart data={chart}>
                <XAxis
                  dataKey="day"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                  }}
                  cursor={{ fill: "var(--accent)" }}
                />
                <RBar dataKey="hours" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <h3 className="mb-3 font-semibold">Activity · 26 weeks</h3>
          <Heatmap byDay={s.byDay} today={s.today} />
        </div>
        <div className="panel p-5">
          <h3 className="mb-3 font-semibold">Weekly hours</h3>
          <div className="h-32">
            <ResponsiveContainer>
              <BarChart data={weekly}>
                <XAxis
                  dataKey="week"
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                  }}
                  cursor={{ fill: "var(--accent)" }}
                />
                <RBar dataKey="hours" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5">
          <h3 className="mb-3 font-semibold">Current milestone</h3>
          <div className="stat-label">Month {cm}</div>
          <div className="mt-1 font-medium">{ms.title}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Status: {msProg?.status ?? "Not Started"} · {month.critDone}/{month.critTotal} criteria
          </div>
          <Bar value={(month.critDone / month.critTotal) * 100} className="mt-3" />
          <Link to="/projects" className="mt-3 inline-block text-sm text-primary hover:underline">
            Open project →
          </Link>
          {deadlines.length > 0 && (
            <div className="mt-4 border-t pt-3 text-xs">
              <div className="stat-label mb-1">Upcoming deadlines</div>
              {deadlines.slice(0, 3).map((d) => (
                <div key={d.id} className="flex justify-between">
                  <span>{MILESTONES[d.milestone_id - 1]?.title}</span>
                  <span className="font-mono">{d.deadline}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="panel p-5">
          <h3 className="mb-3 font-semibold">Recent activity</h3>
          {recent.length === 0 ? (
            <Empty>No sessions logged yet.</Empty>
          ) : (
            <ul className="space-y-2 text-sm">
              {recent.map((r) => (
                <li key={r.id} className="flex justify-between gap-2">
                  <span className="truncate">{r.description || r.category}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {r.date.slice(5)} · {r.minutes}m
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="panel p-5">
          <h3 className="mb-3 font-semibold">Scheduled for revision</h3>
          {revision.length === 0 ? (
            <Empty>Nothing due for revision.</Empty>
          ) : (
            <ul className="space-y-2 text-sm">
              {revision.map((r) => (
                <li key={r.id} className="flex justify-between gap-2">
                  <span className="truncate">{topicById.get(r.topic_id)?.title}</span>
                  <span className="shrink-0 font-mono text-xs text-warning">
                    {r.next_revision ?? "now"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
