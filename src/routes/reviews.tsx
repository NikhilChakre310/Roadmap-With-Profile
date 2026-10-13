import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Stat } from "@/components/AppShell";
import { addDays, weekStart } from "@/lib/calc";
import { useInvalidate, useRows } from "@/lib/data";
import { meta } from "@/lib/meta";
import { useStats } from "@/lib/stats";
import { topicById } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reviews")({
  head: () =>
    meta(
      "Weekly Reviews",
      "Weekly retrospectives summarised from your real activity, plus next week's priorities.",
    ),
  component: Reviews,
});

const FIELDS = [
  ["achievements", "Biggest achievements"],
  ["difficult", "Most difficult concepts"],
  ["mistakes", "Mistakes made"],
  ["lessons", "Lessons learned"],
  ["revisit", "Topics to revisit"],
] as const;

function Reviews() {
  const s = useStats();
  const reviews = useRows("weekly_reviews").data ?? [];
  const tasks = useRows("project_tasks").data ?? [];
  const inv = useInvalidate();
  const [ws, setWs] = useState(weekStart(s.today));
  const we = addDays(ws, 6);
  const r = reviews.find((x) => x.week_start === ws);
  const [f, setF] = useState<Record<string, string>>({});
  const [prio, setPrio] = useState<string[]>(["", "", ""]);
  useEffect(() => {
    setF({
      achievements: r?.achievements ?? "",
      difficult: r?.difficult ?? "",
      mistakes: r?.mistakes ?? "",
      lessons: r?.lessons ?? "",
      revisit: r?.revisit ?? "",
    });
    const p = r?.priorities ?? [];
    setPrio([...p, "", "", ""].slice(0, Math.max(3, p.length)));
  }, [r?.id, ws]); // eslint-disable-line react-hooks/exhaustive-deps

  const inWeek = (d?: string | null) => !!d && d.slice(0, 10) >= ws && d.slice(0, 10) <= we;
  const sess = s.sessions.filter((x) => inWeek(x.date));
  const minutes = sess.reduce((a, x) => a + x.minutes, 0);
  const planned = sess.reduce((a, x) => a + (x.planned_minutes ?? 0), 0);
  const topicsDone = s.progress.filter((p) => p.status === "Completed" && inWeek(p.completed_at));
  const revised = sess.filter((x) => x.category === "Revision").length;
  const attempted = s.problems.filter((p) => inWeek(p.date_attempted)).length;
  const solved = s.problems.filter((p) => inWeek(p.date_solved)).length;
  const tasksDone = tasks.filter((t) => t.done && inWeek(t.done_at)).length;
  const newSubs = s.subs.filter((x) => inWeek(x.created_at)).length;
  const missed = s.settings.weekly_goal_minutes - minutes;
  // Deterministic suggestions from records (no AI).
  const suggestions = [
    missed > 0 && `You were ${missed} minutes short of your weekly goal.`,
    s.needsRevision > 0 && `${s.needsRevision} topics are flagged Needs Revision.`,
    solved === 0 && "No DSA problems solved this week — schedule a DSA block.",
    ...s.progress
      .filter((p) => p.confidence && p.confidence <= 2)
      .slice(0, 3)
      .map((p) => `Low confidence: ${topicById.get(p.topic_id)?.title}`),
  ].filter(Boolean) as string[];

  async function save() {
    const priorities = prio.map((p) => p.trim()).filter(Boolean);
    if (priorities.length > 5) return void toast.error("Keep 3–5 priorities");
    const { error } = await supabase
      .from("weekly_reviews")
      .upsert(
        { week_start: ws, ...f, priorities, updated_at: new Date().toISOString() },
        { onConflict: "user_id,week_start" },
      );
    if (error) return void toast.error(error.message);
    toast.success("Review saved");
    inv("weekly_reviews");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Weekly Reviews" sub={`${ws} → ${we}`}>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setWs(addDays(ws, -7))}
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setWs(addDays(ws, 7))}
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Stat
          label="Focused"
          value={`${(minutes / 60).toFixed(1)}h`}
          hint={`planned ${(planned / 60).toFixed(1)}h`}
        />
        <Stat label="Topics done" value={topicsDone.length} />
        <Stat label="Revision sessions" value={revised} />
        <Stat label="DSA" value={`${solved}/${attempted}`} hint="solved / attempted" />
        <Stat label="Tasks done" value={tasksDone} />
        <Stat label="Submissions" value={newSubs} />
        <Stat label="Goal gap" value={missed > 0 ? `${missed}m` : "met"} />
      </div>
      {suggestions.length > 0 && (
        <div className="panel p-4 text-sm">
          <div className="stat-label mb-2">Areas needing practice (from your records)</div>
          <ul className="list-inside list-disc space-y-1 text-muted-foreground">
            {suggestions.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {FIELDS.map(([k, label]) => (
          <div key={k} className="space-y-1">
            <Label>{label}</Label>
            <Textarea
              rows={3}
              value={f[k] ?? ""}
              onChange={(e) => setF({ ...f, [k]: e.target.value })}
            />
          </div>
        ))}
        <div className="space-y-2">
          <Label>Next week's priorities (3–5)</Label>
          {prio.map((p, i) => (
            <Input
              key={i}
              value={p}
              placeholder={`Priority ${i + 1}`}
              onChange={(e) => setPrio(prio.map((x, j) => (j === i ? e.target.value : x)))}
            />
          ))}
          {prio.length < 5 && (
            <Button variant="ghost" size="sm" onClick={() => setPrio([...prio, ""])}>
              + Add priority
            </Button>
          )}
        </div>
      </div>
      <Button onClick={save}>Save review</Button>
    </div>
  );
}
