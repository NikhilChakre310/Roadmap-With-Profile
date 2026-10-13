import { createFileRoute } from "@tanstack/react-router";
import {
  Bar as RBar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, Stat } from "@/components/AppShell";
import { SESSION_CATEGORIES } from "@/data/catalog";
import { addDays, pct, weekStart } from "@/lib/calc";
import { meta } from "@/lib/meta";
import { useStats } from "@/lib/stats";
import { Heatmap } from "@/components/Heatmap";

export const Route = createFileRoute("/analytics")({
  head: () =>
    meta(
      "Progress Analytics",
      "Charts of focused hours, topic completion, DSA progress and project submissions.",
    ),
  component: Analytics,
});

const tip = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 6,
  },
  cursor: { fill: "var(--accent)" },
};
const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function Analytics() {
  const s = useStats();
  const months = s.months.map((m) => ({
    name: `M${m.id}`,
    topics: pct(m.done, m.total),
    criteria: pct(m.critDone, m.critTotal),
  }));
  const cats = SESSION_CATEGORIES.map((c) => ({
    name: c,
    value: s.sessions.filter((x) => x.category === c).reduce((a, x) => a + x.minutes, 0),
  })).filter((c) => c.value > 0);
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const ws = addDays(weekStart(s.today), (i - 11) * 7);
    const we = addDays(ws, 6);
    const ss = s.sessions.filter((x) => x.date >= ws && x.date <= we);
    return {
      week: ws.slice(5),
      hours: +(ss.reduce((a, x) => a + x.minutes, 0) / 60).toFixed(1),
      solved: s.solved.filter((p) => p.date_solved && p.date_solved >= ws && p.date_solved <= we)
        .length,
    };
  });
  const diff = ["Easy", "Medium", "Hard"].map((d) => ({
    name: d,
    value: s.solved.filter((p) => p.difficulty === d).length,
  }));
  const conf = s.progress.filter((p) => p.confidence);
  const avgConf = conf.length
    ? (conf.reduce((a, p) => a + (p.confidence ?? 0), 0) / conf.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      <PageHeader title="Progress Analytics" sub="Every number comes from records you've saved." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Stat label="Overall" value={`${s.overall}%`} />
        <Stat label="Topics" value={`${s.completed}/${s.topicsTotal}`} />
        <Stat label="Hours" value={(s.totalMinutes / 60).toFixed(1)} />
        <Stat label="Avg confidence" value={avgConf} />
        <Stat label="Slots linked" value={`${pct(s.filledSlots, s.totalSlots)}%`} />
        <Stat
          label="Deployed"
          value={s.subs.filter((x) => x.live_url).length}
          hint="submissions with live URL"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Month completion (topics vs. milestone criteria %)">
          <BarChart data={months}>
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} width={28} />
            <Tooltip {...tip} />
            <RBar dataKey="topics" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
            <RBar dataKey="criteria" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </Card>
        <Card title="Weekly hours & problems solved">
          <LineChart data={weeks}>
            <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} width={28} />
            <Tooltip {...tip} />
            <Line dataKey="hours" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
            <Line dataKey="solved" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
          </LineChart>
        </Card>
        <Card title="Time by category">
          {cats.length ? (
            <PieChart>
              <Pie data={cats} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                {cats.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % 5]} />
                ))}
              </Pie>
              <Tooltip {...tip} />
            </PieChart>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No sessions yet
            </div>
          )}
        </Card>
        <Card title="Solved by difficulty">
          <BarChart data={diff}>
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis
              allowDecimals={false}
              stroke="var(--muted-foreground)"
              fontSize={11}
              width={28}
            />
            <Tooltip {...tip} />
            <RBar dataKey="value" radius={[3, 3, 0, 0]}>
              {diff.map((_, i) => (
                <Cell
                  key={i}
                  fill={["var(--success)", "var(--warning)", "var(--destructive)"][i]}
                />
              ))}
            </RBar>
          </BarChart>
        </Card>
      </div>
      <div className="panel p-5">
        <h3 className="mb-3 font-semibold">Activity · 52 weeks</h3>
        <Heatmap byDay={s.byDay} today={s.today} weeks={52} />
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="panel p-5">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="h-56">
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </div>
  );
}
