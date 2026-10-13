import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pause, Play, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Bar, Empty, PageHeader, Stat } from "@/components/AppShell";
import { SESSION_CATEGORIES, TOPICS } from "@/data/catalog";
import { isSafeUrl, localDay } from "@/lib/calc";
import { useInvalidate, useRows } from "@/lib/data";
import { meta } from "@/lib/meta";
import { useStats } from "@/lib/stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/daily")({
  head: () =>
    meta("Daily Tracker", "Log focused study sessions, run a focus timer and track daily targets."),
  component: Daily,
});

const blank = (date: string) => ({
  date,
  minutes: "",
  planned: "",
  category: "Learning or Video Lessons",
  topic_id: "",
  description: "",
  confidence: "",
  notes: "",
  resource_url: "",
  commit_url: "",
});

function Daily() {
  const s = useStats();
  const inv = useInvalidate();
  const timer = useRows("active_timers").data?.[0];
  const [f, setF] = useState(blank(s.today));
  const [editing, setEditing] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [day, setDay] = useState(s.today);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  useEffect(() => setDay(s.today), [s.today]);

  const set =
    (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const minutes = parseInt(f.minutes, 10);
    if (!Number.isFinite(minutes) || minutes <= 0)
      return void toast.error("Enter focused minutes (whole number > 0)");
    if (!isSafeUrl(f.resource_url) || !isSafeUrl(f.commit_url))
      return void toast.error("Links must be http(s) URLs");
    const topic = TOPICS.find((t) => t.id === f.topic_id);
    const row = {
      date: f.date,
      minutes,
      planned_minutes: f.planned ? parseInt(f.planned, 10) : null,
      category: f.category,
      topic_id: f.topic_id || null,
      month_id: topic?.monthId ?? null,
      description: f.description || null,
      confidence: f.confidence ? Number(f.confidence) : null,
      notes: f.notes || null,
      resource_url: f.resource_url || null,
      commit_url: f.commit_url || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = editing
      ? await supabase.from("study_sessions").update(row).eq("id", editing)
      : await supabase.from("study_sessions").insert(row);
    if (error) return void toast.error(error.message);
    toast.success(editing ? "Session updated" : "Session logged");
    setF(blank(s.today));
    setEditing(null);
    inv("study_sessions");
  }

  async function startTimer() {
    const { error } = await supabase.from("active_timers").insert({
      category: f.category,
      topic_id: f.topic_id || null,
      description: f.description || null,
    });
    if (error) return void toast.error("A timer is already running");
    inv("active_timers");
  }
  async function stopTimer() {
    if (!timer) return;
    const end = new Date();
    const minutes = Math.floor((end.getTime() - new Date(timer.started_at).getTime()) / 60000);
    if (minutes < 1) {
      if (!confirm("Less than a minute recorded. Discard this timer?")) return;
    } else {
      const topic = TOPICS.find((t) => t.id === timer.topic_id);
      const { error } = await supabase.from("study_sessions").insert({
        date: localDay(new Date(timer.started_at), s.settings.timezone),
        start_at: timer.started_at,
        end_at: end.toISOString(),
        minutes,
        category: timer.category,
        topic_id: timer.topic_id,
        month_id: topic?.monthId ?? null,
        description: timer.description,
      });
      if (error) return void toast.error(error.message);
      toast.success(`Saved ${minutes} focused minutes`);
    }
    await supabase.from("active_timers").delete().eq("user_id", timer.user_id);
    inv("active_timers");
    inv("study_sessions");
  }
  async function discardTimer() {
    if (!timer || !confirm("Discard the running timer without saving?")) return;
    await supabase.from("active_timers").delete().eq("user_id", timer.user_id);
    inv("active_timers");
  }
  async function remove(id: string) {
    if (!confirm("Delete this session?")) return;
    await supabase.from("study_sessions").delete().eq("id", id);
    inv("study_sessions");
  }

  const daySessions = s.sessions
    .filter((x) => x.date === day)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const dayMin = daySessions.reduce((a, x) => a + x.minutes, 0);
  const planned = daySessions.reduce((a, x) => a + (x.planned_minutes ?? 0), 0);
  const elapsed = timer ? Math.floor((now - new Date(timer.started_at).getTime()) / 1000) : 0;
  const fmt = (sec: number) =>
    `${String(Math.floor(sec / 3600)).padStart(2, "0")}:${String(Math.floor((sec % 3600) / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  const history = s.last(14).reverse();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Tracker"
        sub="Log real focused time. Missed days stay missed — no fake activity."
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Today"
          value={`${s.todayMinutes}m`}
          hint={`goal ${s.settings.daily_goal_minutes}m`}
        />
        <Stat label="Planned vs actual" value={`${planned}/${dayMin}m`} hint={day} />
        <Stat
          label="This week"
          value={`${(s.weekMinutes / 60).toFixed(1)}h`}
          hint={`goal ${(s.settings.weekly_goal_minutes / 60).toFixed(0)}h`}
        />
        <Stat label="Streak" value={`${s.streak.current}d`} hint={`longest ${s.streak.longest}d`} />
      </div>
      <Bar value={s.dailyPct} />

      <div className="grid gap-4 lg:grid-cols-5">
        <form onSubmit={save} className="panel space-y-3 p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editing ? "Edit session" : "Quick-add session"}</h3>
            <div className="flex items-center gap-2">
              {timer ? (
                <>
                  <span className="font-mono text-primary">{fmt(elapsed)}</span>
                  <Button type="button" size="sm" onClick={stopTimer}>
                    <Pause className="h-4 w-4" />
                    Stop & save
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={discardTimer}>
                    Discard
                  </Button>
                </>
              ) : (
                <Button type="button" size="sm" variant="outline" onClick={startTimer}>
                  <Play className="h-4 w-4" />
                  Start focus timer
                </Button>
              )}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={f.date} onChange={set("date")} required />
            </div>
            <div className="space-y-1">
              <Label>Focused minutes</Label>
              <Input type="number" min={1} value={f.minutes} onChange={set("minutes")} />
            </div>
            <div className="space-y-1">
              <Label>Planned minutes</Label>
              <Input type="number" min={0} value={f.planned} onChange={set("planned")} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Topic</Label>
              <Select
                value={f.topic_id || "none"}
                onValueChange={(v) => setF({ ...f, topic_id: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value="none">No specific topic</SelectItem>
                  {TOPICS.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      M{t.monthId} · {t.parentId ? "— " : ""}
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Input
            placeholder="What did you work on?"
            value={f.description}
            onChange={set("description")}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Select
              value={f.confidence || "none"}
              onValueChange={(v) => setF({ ...f, confidence: v === "none" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Confidence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Confidence —</SelectItem>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    Confidence {n}/5
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Resource URL"
              value={f.resource_url}
              onChange={set("resource_url")}
            />
            <Input placeholder="Commit URL" value={f.commit_url} onChange={set("commit_url")} />
          </div>
          <Textarea
            rows={2}
            placeholder="Notes & achievements"
            value={f.notes}
            onChange={set("notes")}
          />
          <div className="flex gap-2">
            <Button>{editing ? "Update session" : "Log session"}</Button>
            {editing && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditing(null);
                  setF(blank(s.today));
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="panel p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-semibold">Sessions</h3>
            <Input
              type="date"
              className="w-40"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          </div>
          {daySessions.length === 0 ? (
            <Empty>No sessions recorded for {day}.</Empty>
          ) : (
            <ul className="space-y-2">
              {daySessions.map((x) => (
                <li key={x.id} className="flex items-start gap-2 rounded-md border p-2.5 text-sm">
                  <button
                    className="flex-1 text-left"
                    onClick={() => {
                      setEditing(x.id);
                      setF({
                        date: x.date,
                        minutes: String(x.minutes),
                        planned: x.planned_minutes ? String(x.planned_minutes) : "",
                        category: x.category,
                        topic_id: x.topic_id ?? "",
                        description: x.description ?? "",
                        confidence: x.confidence ? String(x.confidence) : "",
                        notes: x.notes ?? "",
                        resource_url: x.resource_url ?? "",
                        commit_url: x.commit_url ?? "",
                      });
                    }}
                  >
                    <div className="font-medium">{x.description || x.category}</div>
                    <div className="text-xs text-muted-foreground">
                      {x.category}
                      {x.topic_id ? ` · ${TOPICS.find((t) => t.id === x.topic_id)?.title}` : ""}
                    </div>
                  </button>
                  <span className="font-mono text-xs">{x.minutes}m</span>
                  <button onClick={() => remove(x.id)} aria-label="Delete session">
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5">
            <div className="stat-label mb-2">By category ({day})</div>
            {SESSION_CATEGORIES.map((c) => {
              const m = daySessions
                .filter((x) => x.category === c)
                .reduce((a, x) => a + x.minutes, 0);
              return m ? (
                <div key={c} className="flex justify-between text-xs">
                  <span>{c}</span>
                  <span className="font-mono">{m}m</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="mb-3 font-semibold">Last 14 days</h3>
        <div className="grid grid-cols-7 gap-2 md:grid-cols-14">
          {history.map((d) => (
            <button
              key={d.date}
              onClick={() => setDay(d.date)}
              className="rounded-md border p-2 text-center hover:bg-accent"
            >
              <div className="stat-label">{d.date.slice(5)}</div>
              <div className={d.minutes ? "font-mono text-sm" : "text-xs text-muted-foreground"}>
                {d.minutes ? `${d.minutes}m` : "missed"}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
