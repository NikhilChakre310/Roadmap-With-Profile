import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, RefreshCw, Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Empty, PageHeader, Stat } from "@/components/AppShell";
import { MONTHS, TOPICS } from "@/data/catalog";
import { isSafeUrl } from "@/lib/calc";
import { useInvalidate, useRows, useSettings } from "@/lib/data";
import { meta } from "@/lib/meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/github")({
  head: () =>
    meta("GitHub Tracker", "Sync public repositories and link them to roadmap months and topics."),
  component: GitHub,
});

type GhRepo = {
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  private: boolean;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  pushed_at: string;
};

function GitHub() {
  const { settings } = useSettings();
  const repos = useRows("github_repos").data ?? [];
  const logs = (useRows("sync_logs").data ?? [])
    .filter((l) => l.service === "github")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const inv = useInvalidate();
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState({ full_name: "", url: "" });
  const user = settings.github_username;

  async function sync() {
    if (!user) return void toast.error("Add your GitHub username in Settings first");
    setBusy(true);
    try {
      const all: GhRepo[] = [];
      for (let page = 1; page <= 5; page++) {
        const r = await fetch(
          `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed&page=${page}`,
        );
        if (r.status === 403) throw new Error("GitHub rate limit reached — try again later");
        if (r.status === 404) throw new Error("GitHub user not found");
        if (!r.ok) throw new Error(`GitHub returned ${r.status}`);
        const batch = (await r.json()) as GhRepo[];
        all.push(...batch);
        if (batch.length < 100) break;
      }
      const now = new Date().toISOString();
      if (all.length) {
        const { error } = await supabase.from("github_repos").upsert(
          all.map((g) => ({
            full_name: g.full_name,
            url: g.html_url,
            description: g.description,
            language: g.language,
            visibility: g.private ? "private" : "public",
            stars: g.stargazers_count,
            forks: g.forks_count,
            gh_created_at: g.created_at,
            gh_updated_at: g.pushed_at,
            source: "github",
            synced_at: now,
          })),
          { onConflict: "user_id,full_name" },
        );
        if (error) throw error;
      }
      await supabase.from("sync_logs").insert({
        service: "github",
        ok: true,
        message: `Synced ${all.length} public repositories`,
      });
      toast.success(`Synced ${all.length} repositories`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase.from("sync_logs").insert({ service: "github", ok: false, message: msg });
      toast.error(msg);
    }
    setBusy(false);
    inv("github_repos");
    inv("sync_logs");
  }

  async function link(id: string, patch: { month_id?: number | null; topic_id?: string | null }) {
    await supabase.from("github_repos").update(patch).eq("id", id);
    inv("github_repos");
  }

  async function addManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manual.full_name || !manual.url || !isSafeUrl(manual.url))
      return void toast.error("Enter a name and a valid https URL");
    const { error } = await supabase.from("github_repos").insert({ ...manual, source: "manual" });
    if (error) return void toast.error(error.message);
    setManual({ full_name: "", url: "" });
    inv("github_repos");
  }

  const sorted = [...repos].sort((a, b) =>
    (b.gh_updated_at ?? b.created_at).localeCompare(a.gh_updated_at ?? a.created_at),
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="GitHub Tracker"
        sub={
          user
            ? `Public data for @${user} from GitHub's REST API. Private repos are not accessed.`
            : "Set your GitHub username in Settings to sync."
        }
      >
        <Button onClick={sync} disabled={busy}>
          <RefreshCw className={busy ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh
        </Button>
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Repositories"
          value={repos.length}
          hint={`${repos.filter((r) => r.source === "github").length} verified · ${repos.filter((r) => r.source === "manual").length} manual`}
        />
        <Stat
          label="Linked to roadmap"
          value={repos.filter((r) => r.month_id || r.topic_id).length}
        />
        <Stat
          label="Stars"
          value={repos.reduce((a, r) => a + (r.stars ?? 0), 0)}
          hint="from GitHub"
        />
        <Stat
          label="Last sync"
          value={logs[0] ? (logs[0].ok ? "OK" : "Failed") : "—"}
          hint={
            logs[0]
              ? `${new Date(logs[0].created_at).toLocaleString()} · ${logs[0].message}`
              : "never"
          }
        />
      </div>
      <form onSubmit={addManual} className="panel flex flex-wrap gap-2 p-4">
        <Input
          className="w-56"
          placeholder="owner/repo (manual)"
          value={manual.full_name}
          onChange={(e) => setManual({ ...manual, full_name: e.target.value })}
        />
        <Input
          className="min-w-56 flex-1"
          placeholder="https://github.com/owner/repo"
          value={manual.url}
          onChange={(e) => setManual({ ...manual, url: e.target.value })}
        />
        <Button variant="outline">Add manually</Button>
      </form>
      {sorted.length === 0 ? (
        <Empty>No repositories yet. Refresh to sync, or add one manually.</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sorted.map((r) => (
            <div key={r.id} className="panel space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 font-medium hover:text-primary"
                  >
                    {r.full_name}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {r.description ??
                      (r.source === "manual"
                        ? "Manually recorded — not verified"
                        : "No description")}
                  </p>
                </div>
                <button
                  aria-label="Remove"
                  onClick={async () => {
                    if (confirm("Remove this repository from tracking?")) {
                      await supabase.from("github_repos").delete().eq("id", r.id);
                      inv("github_repos");
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
              <div className="flex flex-wrap gap-3 font-mono text-xs text-muted-foreground">
                {r.language && <span>{r.language}</span>}
                {r.stars != null && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {r.stars}
                  </span>
                )}
                {r.forks != null && <span>forks {r.forks}</span>}
                {r.gh_updated_at && <span>pushed {r.gh_updated_at.slice(0, 10)}</span>}
                <span>{r.source === "github" ? "verified" : "manual"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={r.month_id ? String(r.month_id) : "none"}
                  onValueChange={(v) => link(r.id, { month_id: v === "none" ? null : Number(v) })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No month</SelectItem>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        Month {m.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={r.topic_id ?? "none"}
                  onValueChange={(v) => link(r.id, { topic_id: v === "none" ? null : v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="none">No topic</SelectItem>
                    {TOPICS.filter((t) => !r.month_id || t.monthId === r.month_id).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.parentId ? "— " : ""}
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
