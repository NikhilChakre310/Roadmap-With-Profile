import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Bar, PageHeader, Stat } from "@/components/AppShell";
import { MILESTONES, MONTHS, TOPICS, type Milestone } from "@/data/catalog";
import { canCompleteMilestone, isSafeUrl, pct } from "@/lib/calc";
import { useInvalidate, useRows } from "@/lib/data";
import { meta } from "@/lib/meta";
import { useStats } from "@/lib/stats";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/projects")({
  head: () =>
    meta(
      "Projects & Milestones",
      "Eight monthly milestone projects with acceptance criteria, plus all topic project submissions.",
    ),
  component: Projects,
});

const COLS = [
  "Not Started",
  "Planning",
  "In Progress",
  "Testing",
  "Deployed",
  "Completed",
] as const;

function Projects() {
  const s = useStats();
  const [sel, setSel] = useState<Milestone | null>(null);
  const statusOf = (id: number) =>
    s.mprog.find((m) => m.milestone_id === id)?.status ?? "Not Started";
  const subsByMonth = MONTHS.map((m) => {
    const ids = new Set(TOPICS.filter((t) => t.monthId === m.id).map((t) => t.id));
    const rows = s.subs.filter((x) => ids.has(x.topic_id));
    return {
      m,
      slots: ids.size * 3,
      linked: rows.filter((x) => x.repo_url || x.live_url || x.demo_url).length,
    };
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects & Milestones"
        sub="A milestone completes only when every mandatory criterion is checked and you confirm."
      />
      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Milestone board</TabsTrigger>
          <TabsTrigger value="subs">Topic submissions</TabsTrigger>
        </TabsList>
        <TabsContent value="board">
          <div className="grid gap-3 overflow-x-auto md:grid-cols-3 xl:grid-cols-6">
            {COLS.map((c) => (
              <div key={c} className="min-w-44 rounded-lg bg-muted/40 p-2">
                <div className="stat-label mb-2 px-1">{c}</div>
                <div className="space-y-2">
                  {MILESTONES.filter((m) => statusOf(m.id) === c).map((m) => {
                    const mo = s.months[m.monthId - 1]!;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSel(m)}
                        className="panel block w-full p-3 text-left hover:border-primary"
                      >
                        <div className="stat-label">Month {m.monthId}</div>
                        <div className="text-sm font-medium">{m.title}</div>
                        <Bar value={pct(mo.critDone, mo.critTotal)} className="mt-2" />
                        <div className="mt-1 font-mono text-xs text-muted-foreground">
                          {mo.critDone}/{mo.critTotal}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="subs" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Stat label="Total slots" value={s.totalSlots} />
            <Stat label="With links" value={s.filledSlots} />
            <Stat label="Completed" value={s.completedSlots} />
            <Stat
              label="In progress"
              value={s.subs.filter((x) => x.status === "In Progress").length}
            />
            <Stat
              label="Needs improvement"
              value={s.subs.filter((x) => x.status === "Needs Improvement").length}
            />
          </div>
          <div className="panel divide-y">
            {subsByMonth.map(({ m, slots, linked }) => (
              <div key={m.id} className="flex items-center gap-4 p-3 text-sm">
                <span className="stat-label w-10">M{m.id}</span>
                <span className="flex-1">{m.title}</span>
                <span className="font-mono text-xs">
                  {linked}/{slots}
                </span>
                <Bar value={pct(linked, slots)} className="w-32" />
              </div>
            ))}
          </div>
          <div className="panel divide-y">
            {s.subs.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No submissions yet. Open a topic in My Roadmap → Submissions.
              </div>
            ) : (
              s.subs.map((x) => (
                <div key={x.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <span className="flex-1">
                    {x.title || `Slot ${x.slot}`}{" "}
                    <span className="text-xs text-muted-foreground">
                      · {TOPICS.find((t) => t.id === x.topic_id)?.title}
                    </span>
                  </span>
                  <span className="text-xs">{x.status}</span>
                  {x.repo_url && (
                    <a
                      className="text-xs text-primary"
                      href={x.repo_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      repo
                    </a>
                  )}
                  {x.live_url && (
                    <a
                      className="text-xs text-primary"
                      href={x.live_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      live
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      <MilestoneSheet m={sel} onClose={() => setSel(null)} />
    </div>
  );
}

function MilestoneSheet({ m, onClose }: { m: Milestone | null; onClose: () => void }) {
  const s = useStats();
  const tasks = useRows("project_tasks").data ?? [];
  const inv = useInvalidate();
  const p = m ? s.mprog.find((x) => x.milestone_id === m.id) : undefined;
  const [f, setF] = useState({
    status: "Not Started",
    repo_url: "",
    live_url: "",
    demo_url: "",
    start_date: "",
    deadline: "",
    actual_hours: "",
    tech_stack: "",
    lessons: "",
    readme_done: false,
    tests_done: false,
  });
  const [newTask, setNewTask] = useState("");
  useEffect(() => {
    setF({
      status: p?.status ?? "Not Started",
      repo_url: p?.repo_url ?? "",
      live_url: p?.live_url ?? "",
      demo_url: p?.demo_url ?? "",
      start_date: p?.start_date ?? "",
      deadline: p?.deadline ?? "",
      actual_hours: p?.actual_hours != null ? String(p.actual_hours) : "",
      tech_stack: p?.tech_stack ?? "",
      lessons: p?.lessons ?? "",
      readme_done: p?.readme_done ?? false,
      tests_done: p?.tests_done ?? false,
    });
  }, [p?.id, p?.updated_at, m?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!m) return null;
  const mand = m.criteria.filter((c) => c.kind === "mandatory");
  const bonus = m.criteria.filter((c) => c.kind === "bonus");
  const mt = tasks.filter((t) => t.milestone_id === m.id);

  async function toggle(id: string, on: boolean) {
    const { error } = on
      ? await supabase.from("criterion_checks").insert({ criterion_id: id })
      : await supabase.from("criterion_checks").delete().eq("criterion_id", id);
    if (error) toast.error(error.message);
    inv("criterion_checks");
  }
  async function save(status = f.status) {
    for (const k of ["repo_url", "live_url", "demo_url"] as const)
      if (!isSafeUrl(f[k])) return void toast.error("Links must be http(s) URLs");
    let confirmed = p?.confirmed_complete ?? false;
    if (status === "Completed") {
      if (
        !canCompleteMilestone(
          mand.map((c) => c.id),
          s.checked,
          true,
        )
      )
        return void toast.error("Check every mandatory acceptance criterion first");
      if (!confirm(`Confirm that "${m!.title}" is complete?`)) return;
      confirmed = true;
    } else confirmed = false;
    const { error } = await supabase.from("milestone_progress").upsert(
      {
        milestone_id: m!.id,
        status,
        repo_url: f.repo_url || null,
        live_url: f.live_url || null,
        demo_url: f.demo_url || null,
        start_date: f.start_date || null,
        deadline: f.deadline || null,
        actual_hours: f.actual_hours ? Number(f.actual_hours) : null,
        tech_stack: f.tech_stack || null,
        lessons: f.lessons || null,
        readme_done: f.readme_done,
        tests_done: f.tests_done,
        confirmed_complete: confirmed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,milestone_id" },
    );
    if (error) return void toast.error(error.message);
    toast.success("Milestone saved");
    inv("milestone_progress");
  }
  const set =
    (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value });

  return (
    <Sheet open={!!m} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <div className="stat-label">Month {m.monthId} milestone</div>
          <SheetTitle className="font-display text-xl">{m.title}</SheetTitle>
        </SheetHeader>
        <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>
        <div className="mt-4 space-y-4">
          <div>
            <div className="stat-label mb-2">
              Mandatory acceptance criteria ({mand.filter((c) => s.checked.has(c.id)).length}/
              {mand.length})
            </div>
            {mand.map((c) => (
              <label key={c.id} className="flex items-start gap-2 py-1 text-sm">
                <Checkbox
                  className="mt-0.5"
                  checked={s.checked.has(c.id)}
                  onCheckedChange={(v) => toggle(c.id, !!v)}
                />
                {c.text}
              </label>
            ))}
          </div>
          {bonus.length > 0 && (
            <div>
              <div className="stat-label mb-2">Optional bonus (never blocks completion)</div>
              {bonus.map((c) => (
                <label
                  key={c.id}
                  className="flex items-start gap-2 py-1 text-sm text-muted-foreground"
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={s.checked.has(c.id)}
                    onCheckedChange={(v) => toggle(c.id, !!v)}
                  />
                  {c.text}
                </label>
              ))}
            </div>
          )}
          <div>
            <div className="stat-label mb-2">Tasks</div>
            {mt.map((t) => (
              <div key={t.id} className="flex items-center gap-2 py-1 text-sm">
                <Checkbox
                  checked={t.done}
                  onCheckedChange={async (v) => {
                    await supabase
                      .from("project_tasks")
                      .update({ done: !!v, done_at: v ? new Date().toISOString() : null })
                      .eq("id", t.id);
                    inv("project_tasks");
                  }}
                />
                <span className="flex-1">{t.title}</span>
                <button
                  onClick={async () => {
                    if (confirm("Delete task?")) {
                      await supabase.from("project_tasks").delete().eq("id", t.id);
                      inv("project_tasks");
                    }
                  }}
                  aria-label="Delete task"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            ))}
            <form
              className="mt-1 flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newTask.trim()) return;
                await supabase
                  .from("project_tasks")
                  .insert({ milestone_id: m.id, title: newTask.trim() });
                setNewTask("");
                inv("project_tasks");
              }}
            >
              <Input
                placeholder="New task"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
              />
              <Button size="icon" variant="outline" aria-label="Add task">
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Actual hours</Label>
              <Input type="number" min={0} value={f.actual_hours} onChange={set("actual_hours")} />
            </div>
            <div className="space-y-1">
              <Label>Start date</Label>
              <Input type="date" value={f.start_date} onChange={set("start_date")} />
            </div>
            <div className="space-y-1">
              <Label>Deadline</Label>
              <Input type="date" value={f.deadline} onChange={set("deadline")} />
            </div>
            <Input
              placeholder="GitHub repository URL"
              value={f.repo_url}
              onChange={set("repo_url")}
            />
            <Input placeholder="Deployment URL" value={f.live_url} onChange={set("live_url")} />
            <Input placeholder="Demo URL" value={f.demo_url} onChange={set("demo_url")} />
            <Input placeholder="Tech stack" value={f.tech_stack} onChange={set("tech_stack")} />
          </div>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={f.readme_done}
                onCheckedChange={(v) => setF({ ...f, readme_done: !!v })}
              />
              README written
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={f.tests_done}
                onCheckedChange={(v) => setF({ ...f, tests_done: !!v })}
              />
              Tests added
            </label>
          </div>
          <Textarea
            rows={3}
            placeholder="Lessons learned"
            value={f.lessons}
            onChange={set("lessons")}
          />
          <Button onClick={() => save()}>Save milestone</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
