import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Empty, PageHeader, Stat } from "@/components/AppShell";
import { isSafeUrl, streaks, weekStart } from "@/lib/calc";
import { useInvalidate, useRows } from "@/lib/data";
import { meta } from "@/lib/meta";
import { useStats } from "@/lib/stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dsa")({
  head: () =>
    meta(
      "DSA / LeetCode",
      "Track coding problems, attempts, difficulty, revision dates and solving streaks.",
    ),
  component: DSA,
});

const STATUSES = ["To Do", "Attempted", "Solved", "Needs Revision"] as const;
const DIFFS = ["Easy", "Medium", "Hard"] as const;
const blank = {
  problem_id: "",
  title: "",
  url: "",
  difficulty: "Easy",
  topic: "",
  status: "To Do",
  minutes: "",
  attempts: "1",
  language: "",
  solution_notes: "",
  mistakes: "",
  complexity: "",
  next_revision: "",
  solution_url: "",
};
const DIFF_COLOR: Record<string, string> = {
  Easy: "text-success",
  Medium: "text-warning",
  Hard: "text-destructive",
};

function DSA() {
  const s = useStats();
  const problems = useRows("dsa_problems").data ?? [];
  const inv = useInvalidate();
  const [f, setF] = useState({ ...blank, language: s.settings.preferred_language });
  const [editing, setEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState({ status: "all", diff: "all", q: "" });
  const set =
    (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) return void toast.error("Title is required");
    if (!isSafeUrl(f.url) || !isSafeUrl(f.solution_url))
      return void toast.error("Links must be http(s) URLs");
    const prev = problems.find((p) => p.id === editing);
    const today = s.today;
    const row = {
      problem_id: f.problem_id || null,
      title: f.title.trim(),
      url: f.url || null,
      difficulty: f.difficulty,
      topic: f.topic || null,
      status: f.status,
      minutes: f.minutes ? parseInt(f.minutes, 10) : null,
      attempts: parseInt(f.attempts || "0", 10),
      language: f.language || null,
      solution_notes: f.solution_notes || null,
      mistakes: f.mistakes || null,
      complexity: f.complexity || null,
      next_revision: f.next_revision || null,
      solution_url: f.solution_url || null,
      date_attempted: prev?.date_attempted ?? (f.status !== "To Do" ? today : null),
      date_solved:
        f.status === "Solved" ? (prev?.date_solved ?? today) : (prev?.date_solved ?? null),
      updated_at: new Date().toISOString(),
    };
    const { error } = editing
      ? await supabase.from("dsa_problems").update(row).eq("id", editing)
      : await supabase.from("dsa_problems").insert(row);
    if (error) return void toast.error(error.message);
    toast.success("Problem saved");
    setF({ ...blank, language: s.settings.preferred_language });
    setEditing(null);
    inv("dsa_problems");
  }

  async function importCsv(file: File) {
    const text = await file.text();
    const [head = "", ...lines] = text.trim().split(/\r?\n/);
    const cols = head.split(",").map((c) => c.trim().toLowerCase());
    const existing = new Set(problems.map((p) => p.title.toLowerCase()));
    const rows = lines
      .map((l) => Object.fromEntries(l.split(",").map((v, i) => [cols[i], v.trim()])))
      .filter((r) => r.title && !existing.has(r.title.toLowerCase()))
      .map((r) => ({
        title: r.title,
        url: isSafeUrl(r.url) ? r.url || null : null,
        difficulty: DIFFS.includes(r.difficulty as never) ? r.difficulty : "Easy",
        status: STATUSES.includes(r.status as never) ? r.status : "To Do",
        topic: r.topic || null,
        source: "csv-import",
      }));
    if (!rows.length) return void toast.info("No new valid rows (duplicates are skipped)");
    const { error } = await supabase.from("dsa_problems").insert(rows);
    if (error) return void toast.error(error.message);
    toast.success(`Imported ${rows.length} problems`);
    inv("dsa_problems");
  }

  const solved = problems.filter((p) => p.status === "Solved");
  const ws = weekStart(s.today);
  const solvedDays = solved.map((p) => p.date_solved).filter(Boolean) as string[];
  const st = streaks(solvedDays, s.today);
  const backlog = problems.filter(
    (p) => p.status === "Needs Revision" || (p.next_revision && p.next_revision <= s.today),
  );
  const topics = [...new Set(problems.map((p) => p.topic).filter(Boolean))] as string[];
  const list = problems
    .filter(
      (p) =>
        (filter.status === "all" || p.status === filter.status) &&
        (filter.diff === "all" || p.difficulty === filter.diff) &&
        (!filter.q || `${p.title} ${p.topic}`.toLowerCase().includes(filter.q.toLowerCase())),
    )
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return (
    <div className="space-y-6">
      <PageHeader
        title="DSA / LeetCode Tracker"
        sub="Manual tracking — LeetCode has no official public API, so nothing is auto-synced or assumed solved."
      >
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
          <Upload className="h-4 w-4" />
          Import CSV
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])}
          />
        </label>
        {s.settings.leetcode_username && (
          <a
            href={`https://leetcode.com/u/${s.settings.leetcode_username}/`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Profile <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Stat label="Solved" value={solved.length} hint="manually recorded" />
        {DIFFS.map((d) => (
          <Stat
            key={d}
            label={d}
            value={
              <span className={DIFF_COLOR[d]}>
                {solved.filter((p) => p.difficulty === d).length}
              </span>
            }
          />
        ))}
        <Stat
          label="Today / week"
          value={`${solved.filter((p) => p.date_solved === s.today).length} / ${solved.filter((p) => p.date_solved && p.date_solved >= ws).length}`}
          hint={`targets ${s.settings.leetcode_daily_target}/${s.settings.leetcode_weekly_target}`}
        />
        <Stat
          label="Solve streak"
          value={`${st.current}d`}
          hint={`longest ${st.longest}d · backlog ${backlog.length}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <form onSubmit={save} className="panel space-y-2 p-5 lg:col-span-2">
          <h3 className="font-semibold">{editing ? "Edit problem" : "Add problem"}</h3>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="#ID" value={f.problem_id} onChange={set("problem_id")} />
            <Input
              className="col-span-2"
              placeholder="Title *"
              value={f.title}
              onChange={set("title")}
            />
          </div>
          <Input placeholder="Problem URL" value={f.url} onChange={set("url")} />
          <div className="grid grid-cols-2 gap-2">
            <Select value={f.difficulty} onValueChange={(v) => setF({ ...f, difficulty: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Topic (e.g. Two pointers)"
              value={f.topic}
              onChange={set("topic")}
            />
            <Input placeholder="Language" value={f.language} onChange={set("language")} />
            <Input
              type="number"
              min={0}
              placeholder="Minutes spent"
              value={f.minutes}
              onChange={set("minutes")}
            />
            <Input
              type="number"
              min={0}
              placeholder="Attempts"
              value={f.attempts}
              onChange={set("attempts")}
            />
            <Input
              placeholder="Complexity e.g. O(n)"
              value={f.complexity}
              onChange={set("complexity")}
            />
            <Input
              type="date"
              title="Next revision"
              value={f.next_revision}
              onChange={set("next_revision")}
            />
          </div>
          <Input
            placeholder="GitHub solution URL"
            value={f.solution_url}
            onChange={set("solution_url")}
          />
          <Textarea
            rows={2}
            placeholder="Solution notes"
            value={f.solution_notes}
            onChange={set("solution_notes")}
          />
          <Textarea
            rows={2}
            placeholder="Mistakes made"
            value={f.mistakes}
            onChange={set("mistakes")}
          />
          <div className="flex gap-2">
            <Button>{editing ? "Update" : "Add problem"}</Button>
            {editing && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditing(null);
                  setF(blank);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            CSV columns: title,url,difficulty,status,topic
          </p>
        </form>

        <div className="panel p-5 lg:col-span-3">
          <div className="mb-3 flex flex-wrap gap-2">
            <Input
              className="w-40"
              placeholder="Search"
              value={filter.q}
              onChange={(e) => setFilter({ ...filter, q: e.target.value })}
            />
            <Select
              value={filter.status}
              onValueChange={(v) => setFilter({ ...filter, status: v })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filter.diff} onValueChange={(v) => setFilter({ ...filter, diff: v })}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {DIFFS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {list.length === 0 ? (
            <Empty>No problems yet. Add your first one.</Empty>
          ) : (
            <ul className="divide-y">
              {list.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2 text-sm">
                  <button
                    className="flex-1 text-left"
                    onClick={() => {
                      setEditing(p.id);
                      setF({
                        problem_id: p.problem_id ?? "",
                        title: p.title,
                        url: p.url ?? "",
                        difficulty: p.difficulty,
                        topic: p.topic ?? "",
                        status: p.status,
                        minutes: p.minutes ? String(p.minutes) : "",
                        attempts: String(p.attempts),
                        language: p.language ?? "",
                        solution_notes: p.solution_notes ?? "",
                        mistakes: p.mistakes ?? "",
                        complexity: p.complexity ?? "",
                        next_revision: p.next_revision ?? "",
                        solution_url: p.solution_url ?? "",
                      });
                    }}
                  >
                    <div className="font-medium">
                      {p.problem_id ? `${p.problem_id}. ` : ""}
                      {p.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.topic ?? "—"} · {p.attempts} attempts
                      {p.next_revision ? ` · revise ${p.next_revision}` : ""}
                    </div>
                  </button>
                  <span className={cn("text-xs", DIFF_COLOR[p.difficulty])}>{p.difficulty}</span>
                  <span className="w-24 text-right text-xs text-muted-foreground">{p.status}</span>
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noreferrer" aria-label="Open problem">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    aria-label="Delete"
                    onClick={async () => {
                      if (confirm("Delete this problem?")) {
                        await supabase.from("dsa_problems").delete().eq("id", p.id);
                        inv("dsa_problems");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {topics.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {topics.map((t) => (
                <span key={t} className="rounded-full border px-2 py-0.5 text-xs">
                  {t} · {problems.filter((p) => p.topic === t && p.status === "Solved").length}/
                  {problems.filter((p) => p.topic === t).length}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
