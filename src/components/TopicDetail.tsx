import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RESOURCES, subtopicsOf, type Topic } from "@/data/catalog";
import { useInvalidate, useRows, type Row } from "@/lib/data";
import { isSafeUrl } from "@/lib/calc";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Empty } from "./AppShell";

export const TOPIC_STATUSES = [
  "Not Started",
  "In Progress",
  "Completed",
  "Needs Revision",
] as const;
const SLOT_STATUSES = ["Not Started", "In Progress", "Completed", "Needs Improvement"] as const;
const SLOT_NAMES = ["Practice Project", "Intermediate Project", "Portfolio Project"];

export async function setTopicStatus(topicId: string, status: string) {
  const { error } = await supabase.from("topic_progress").upsert(
    {
      topic_id: topicId,
      status,
      completed_at: status === "Completed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,topic_id" },
  );
  if (error) toast.error(error.message);
}

export function TopicDetail({ topic, onClose }: { topic: Topic | null; onClose: () => void }) {
  const progress = useRows("topic_progress").data ?? [];
  const sessions = useRows("study_sessions").data ?? [];
  const problems = useRows("dsa_problems").data ?? [];
  const repos = useRows("github_repos").data ?? [];
  const inv = useInvalidate();
  const p = topic ? progress.find((x) => x.topic_id === topic.id) : undefined;
  const [form, setForm] = useState({
    notes: "",
    revision_notes: "",
    next_revision: "",
    confidence: "",
  });

  useEffect(() => {
    setForm({
      notes: p?.notes ?? "",
      revision_notes: p?.revision_notes ?? "",
      next_revision: p?.next_revision ?? "",
      confidence: p?.confidence ? String(p.confidence) : "",
    });
  }, [p?.id, topic?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!topic) return null;
  const actual = sessions.filter((s) => s.topic_id === topic.id).reduce((a, s) => a + s.minutes, 0);
  const res = RESOURCES.filter((r) => r.monthId === topic.monthId);
  const linkedProblems = problems.filter(
    (x) => x.topic && x.topic.toLowerCase().includes(topic.title.toLowerCase().split(" ")[0] ?? ""),
  );
  const linkedRepos = repos.filter((r) => r.topic_id === topic.id);
  const subs = subtopicsOf(topic.id);

  async function save() {
    const { error } = await supabase.from("topic_progress").upsert(
      {
        topic_id: topic!.id,
        status: p?.status ?? "In Progress",
        notes: form.notes || null,
        revision_notes: form.revision_notes || null,
        next_revision: form.next_revision || null,
        confidence: form.confidence ? Number(form.confidence) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,topic_id" },
    );
    if (error) return void toast.error(error.message);
    toast.success("Saved");
    inv("topic_progress");
  }

  return (
    <Sheet open={!!topic} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <div className="stat-label">
            Month {topic.monthId} · {topic.parentId ? "Subtopic" : "Topic"}
          </div>
          <SheetTitle className="font-display text-xl">{topic.title}</SheetTitle>
        </SheetHeader>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Select
            value={p?.status ?? "Not Started"}
            onValueChange={async (v) => {
              await setTopicStatus(topic.id, v);
              inv("topic_progress");
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOPIC_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            Watching a video never marks a topic complete — you decide.
          </span>
        </div>
        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="flex h-auto flex-wrap">
            {["overview", "learn", "practice", "notes", "projects", "github", "revision"].map(
              (t) => (
                <TabsTrigger key={t} value={t} className="capitalize">
                  {t === "projects" ? "Submissions" : t}
                </TabsTrigger>
              ),
            )}
          </TabsList>
          <TabsContent value="overview" className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <div className="panel p-3">
                <div className="stat-label">Estimated</div>
                <div className="font-mono">{topic.estHours}h</div>
              </div>
              <div className="panel p-3">
                <div className="stat-label">Actual</div>
                <div className="font-mono">{(actual / 60).toFixed(1)}h</div>
              </div>
              <div className="panel p-3">
                <div className="stat-label">Confidence</div>
                <div className="font-mono">{p?.confidence ?? "—"}/5</div>
              </div>
            </div>
            {subs.length > 0 && (
              <div>
                <div className="stat-label mb-1">Subtopics ({subs.length})</div>
                <ul className="list-inside list-disc text-muted-foreground">
                  {subs.map((s) => (
                    <li key={s.id}>{s.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
          <TabsContent value="learn" className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Resources from your roadmap for this month. All are marked “Needs Verification” until
              you confirm them.
            </p>
            {res.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="panel flex items-center justify-between p-3 text-sm hover:bg-accent"
              >
                <span>
                  {r.title} <span className="text-xs text-muted-foreground">· {r.type}</span>
                </span>
                <ExternalLink className="h-4 w-4" />
              </a>
            ))}
          </TabsContent>
          <TabsContent value="practice" className="space-y-2 text-sm">
            <ul className="list-inside list-disc text-muted-foreground">
              {topic.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="stat-label mt-3">Linked DSA problems</div>
            {linkedProblems.length === 0 ? (
              <Empty>No problems tagged with this topic yet.</Empty>
            ) : (
              linkedProblems.map((x) => (
                <div key={x.id}>
                  {x.title} · {x.status}
                </div>
              ))
            )}
          </TabsContent>
          <TabsContent value="notes" className="space-y-2">
            <Textarea
              rows={8}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Learning notes and key takeaways"
            />
            <Button onClick={save}>Save notes</Button>
          </TabsContent>
          <TabsContent value="projects" className="space-y-3">
            {[1, 2, 3].map((n) => (
              <SlotCard key={n} topic={topic} slot={n} />
            ))}
          </TabsContent>
          <TabsContent value="github" className="space-y-2 text-sm">
            {linkedRepos.length === 0 ? (
              <Empty>No repository linked. Link one from the GitHub Tracker.</Empty>
            ) : (
              linkedRepos.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="panel block p-3 hover:bg-accent"
                >
                  <div className="font-medium">{r.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.language ?? "—"} ·{" "}
                    {r.source === "github" ? "verified from GitHub" : "manual entry"}
                  </div>
                </a>
              ))
            )}
          </TabsContent>
          <TabsContent value="revision" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Confidence (1–5)</Label>
                <Select
                  value={form.confidence}
                  onValueChange={(v) => setForm({ ...form, confidence: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Next revision</Label>
                <Input
                  type="date"
                  value={form.next_revision}
                  onChange={(e) => setForm({ ...form, next_revision: e.target.value })}
                />
              </div>
            </div>
            <Textarea
              rows={4}
              value={form.revision_notes}
              onChange={(e) => setForm({ ...form, revision_notes: e.target.value })}
              placeholder="Revision notes"
            />
            <Button onClick={save}>Save revision plan</Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function SlotCard({ topic, slot }: { topic: Topic; slot: number }) {
  const subs = useRows("topic_submissions").data ?? [];
  const inv = useInvalidate();
  const existing = subs.find((s) => s.topic_id === topic.id && s.slot === slot);
  const blank = {
    title: "",
    repo_url: "",
    live_url: "",
    demo_url: "",
    technologies: "",
    status: "Not Started",
    notes: "",
    lessons: "",
    actual_hours: "",
  };
  const [f, setF] = useState(blank);
  useEffect(() => {
    setF(
      existing
        ? {
            title: existing.title ?? "",
            repo_url: existing.repo_url ?? "",
            live_url: existing.live_url ?? "",
            demo_url: existing.demo_url ?? "",
            technologies: existing.technologies ?? "",
            status: existing.status,
            notes: existing.notes ?? "",
            lessons: existing.lessons ?? "",
            actual_hours: existing.actual_hours != null ? String(existing.actual_hours) : "",
          }
        : blank,
    );
  }, [existing?.id, existing?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    for (const k of ["repo_url", "live_url", "demo_url"] as const)
      if (!isSafeUrl(f[k]))
        return void toast.error(`Invalid ${k.replace("_", " ")} — use http(s) links only`);
    const { error } = await supabase.from("topic_submissions").upsert(
      {
        topic_id: topic.id,
        slot,
        title: f.title || null,
        repo_url: f.repo_url || null,
        live_url: f.live_url || null,
        demo_url: f.demo_url || null,
        technologies: f.technologies || null,
        status: f.status,
        notes: f.notes || null,
        lessons: f.lessons || null,
        actual_hours: f.actual_hours ? Number(f.actual_hours) : null,
        completion_date: f.status === "Completed" ? new Date().toISOString().slice(0, 10) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,topic_id,slot" },
    );
    if (error) return void toast.error(error.message);
    toast.success(`Slot ${slot} saved`);
    inv("topic_submissions");
  }
  async function remove() {
    if (!existing || !confirm("Delete this submission? This removes its links.")) return;
    await supabase.from("topic_submissions").delete().eq("id", existing.id);
    inv("topic_submissions");
  }
  const set =
    (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value });

  return (
    <div className="panel space-y-2 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="stat-label">
            Project {slot} — {SLOT_NAMES[slot - 1]}
          </div>
          <div className="text-xs text-muted-foreground">Idea: {topic.suggestions[slot - 1]}</div>
        </div>
        {existing && (
          <button onClick={remove} aria-label="Delete submission">
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </button>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input placeholder="Your project title" value={f.title} onChange={set("title")} />
        <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SLOT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="GitHub repo URL" value={f.repo_url} onChange={set("repo_url")} />
        <Input placeholder="Live deployment URL" value={f.live_url} onChange={set("live_url")} />
        <Input placeholder="Demo video URL" value={f.demo_url} onChange={set("demo_url")} />
        <Input placeholder="Technologies" value={f.technologies} onChange={set("technologies")} />
        <Input
          placeholder="Actual hours"
          type="number"
          min={0}
          value={f.actual_hours}
          onChange={set("actual_hours")}
        />
      </div>
      <Textarea
        rows={2}
        placeholder="Notes / lessons learned"
        value={f.lessons}
        onChange={set("lessons")}
      />
      <Button size="sm" onClick={save}>
        Save slot
      </Button>
    </div>
  );
}

export type { Row };
