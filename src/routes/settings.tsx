import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { useInvalidate, useSettings, type TableName } from "@/lib/data";
import { meta } from "@/lib/meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/settings")({
  head: () =>
    meta(
      "Settings",
      "Configure goals, timezone, GitHub and LeetCode profiles, theme and data export.",
    ),
  component: SettingsPage,
});

const EXPORT: TableName[] = [
  "user_settings",
  "topic_progress",
  "topic_submissions",
  "study_sessions",
  "milestone_progress",
  "criterion_checks",
  "project_tasks",
  "resource_status",
  "dsa_problems",
  "github_repos",
  "weekly_reviews",
];

function SettingsPage() {
  const { settings, data } = useSettings();
  const inv = useInvalidate();
  const [f, setF] = useState(settings);
  const [light, setLight] = useState(false);
  useEffect(() => setF(settings), [data?.[0]?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setLight(document.documentElement.classList.contains("light")), []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      new Intl.DateTimeFormat("en", { timeZone: f.timezone });
    } catch {
      return void toast.error("Unknown timezone");
    }
    const { error } = await supabase.from("user_settings").upsert(
      {
        ...f,
        start_date: f.start_date || new Date().toISOString().slice(0, 10),
        github_username: f.github_username || null,
        leetcode_username: f.leetcode_username || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) return void toast.error(error.message);
    toast.success("Settings saved");
    inv("user_settings");
  }
  async function exportJson() {
    const out: Record<string, unknown> = { exported_at: new Date().toISOString() };
    for (const t of EXPORT) out[t] = (await supabase.from(t).select("*")).data;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }),
    );
    a.download = `devroadmap-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }
  async function exportCsv() {
    const { data: rows } = await supabase.from("study_sessions").select("*").order("date");
    if (!rows?.length) return void toast.info("No sessions to export");
    const cols = Object.keys(rows[0]!);
    const csv = [
      cols.join(","),
      ...rows.map((r) =>
        cols.map((c) => JSON.stringify((r as Record<string, unknown>)[c] ?? "")).join(","),
      ),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "devroadmap-sessions.csv";
    a.click();
  }
  const num = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: Number(e.target.value) });
  const txt = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Settings" />
      <form onSubmit={save} className="panel space-y-5 p-5">
        <Section title="Schedule">
          <Field label="Roadmap start date">
            <Input type="date" value={f.start_date ?? ""} onChange={txt("start_date")} />
          </Field>
          <Field label="Timezone">
            <Input value={f.timezone} onChange={txt("timezone")} />
          </Field>
        </Section>
        <Section title="Goals (minutes)">
          <Field label="Daily goal">
            <Input
              type="number"
              min={0}
              value={f.daily_goal_minutes}
              onChange={num("daily_goal_minutes")}
            />
          </Field>
          <Field label="Weekly goal">
            <Input
              type="number"
              min={0}
              value={f.weekly_goal_minutes}
              onChange={num("weekly_goal_minutes")}
            />
          </Field>
          <Field label="DSA / day">
            <Input
              type="number"
              min={0}
              value={f.dsa_target_minutes}
              onChange={num("dsa_target_minutes")}
            />
          </Field>
          <Field label="Learning / day">
            <Input
              type="number"
              min={0}
              value={f.learning_target_minutes}
              onChange={num("learning_target_minutes")}
            />
          </Field>
          <Field label="Project / day">
            <Input
              type="number"
              min={0}
              value={f.project_target_minutes}
              onChange={num("project_target_minutes")}
            />
          </Field>
        </Section>
        <Section title="Profiles">
          <Field label="GitHub username">
            <Input value={f.github_username} onChange={txt("github_username")} />
          </Field>
          <Field label="LeetCode username">
            <Input value={f.leetcode_username} onChange={txt("leetcode_username")} />
          </Field>
          <Field label="Preferred language">
            <Input value={f.preferred_language} onChange={txt("preferred_language")} />
          </Field>
          <Field label="LeetCode daily target">
            <Input
              type="number"
              min={0}
              value={f.leetcode_daily_target}
              onChange={num("leetcode_daily_target")}
            />
          </Field>
          <Field label="LeetCode weekly target">
            <Input
              type="number"
              min={0}
              value={f.leetcode_weekly_target}
              onChange={num("leetcode_weekly_target")}
            />
          </Field>
        </Section>
        <Button>Save settings</Button>
      </form>
      <div className="panel flex items-center justify-between p-5">
        <div>
          <div className="font-medium">Light theme</div>
          <div className="text-xs text-muted-foreground">Dark is the default.</div>
        </div>
        <Switch
          checked={light}
          onCheckedChange={(v) => {
            setLight(v);
            document.documentElement.classList.toggle("light", v);
            localStorage.setItem("theme", v ? "light" : "dark");
          }}
        />
      </div>
      <div className="panel flex flex-wrap items-center gap-2 p-5">
        <div className="mr-auto">
          <div className="font-medium">Export your data</div>
          <div className="text-xs text-muted-foreground">
            Everything you've recorded, as a file.
          </div>
        </div>
        <Button variant="outline" onClick={exportJson}>
          <Download className="h-4 w-4" />
          JSON
        </Button>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4" />
          Sessions CSV
        </Button>
      </div>
    </div>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <div className="stat-label mb-2">{title}</div>
    <div className="grid gap-3 sm:grid-cols-2">{children}</div>
  </div>
);
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    {children}
  </div>
);
