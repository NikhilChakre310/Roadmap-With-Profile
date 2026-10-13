import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { MONTHS, RESOURCES } from "@/data/catalog";
import { useInvalidate, useRows } from "@/lib/data";
import { meta } from "@/lib/meta";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/resources")({
  head: () =>
    meta(
      "Learning Resources",
      "Searchable courses, docs and channels for every month of the roadmap.",
    ),
  component: Resources,
});

const STATUSES = ["Not Started", "In Progress", "Watched / Read"];

function Resources() {
  const status = useRows("resource_status").data ?? [];
  const inv = useInvalidate();
  const [q, setQ] = useState("");
  const [month, setMonth] = useState("all");
  const [type, setType] = useState("all");
  const types = [...new Set(RESOURCES.map((r) => r.type))];
  const list = RESOURCES.filter(
    (r) =>
      (month === "all" || r.monthId === Number(month)) &&
      (type === "all" || r.type === type) &&
      (!q || `${r.title} ${r.url}`.toLowerCase().includes(q.toLowerCase())),
  );

  async function update(
    id: string,
    patch: { status?: string; rating?: number | null; notes?: string },
  ) {
    const cur = status.find((s) => s.resource_id === id);
    await supabase.from("resource_status").upsert(
      {
        resource_id: id,
        status: cur?.status ?? "Not Started",
        ...patch,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,resource_id" },
    );
    inv("resource_status");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning Resources"
        sub="Only resources from your roadmap. Each stays “Needs Verification” — durations and pricing are not assumed."
      />
      <div className="flex flex-wrap gap-2">
        <Input
          className="w-56"
          placeholder="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All months</SelectItem>
            {MONTHS.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                Month {m.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((r) => {
          const st = status.find((s) => s.resource_id === r.id);
          return (
            <div key={r.id} className="panel space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="stat-label">
                    Month {r.monthId} · {r.type}
                  </div>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 font-medium hover:text-primary"
                  >
                    {r.title}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <div className="truncate text-xs text-muted-foreground">{r.url}</div>
                </div>
                <span className="shrink-0 rounded-full border border-warning/40 px-2 py-0.5 text-[10px] text-warning">
                  Needs Verification
                </span>
              </div>
              <div className="flex gap-2">
                <Select
                  value={st?.status ?? "Not Started"}
                  onValueChange={(v) => update(r.id, { status: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={st?.rating ? String(st.rating) : "none"}
                  onValueChange={(v) => update(r.id, { rating: v === "none" ? null : Number(v) })}
                >
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No rating</SelectItem>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {"★".repeat(n)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                className="h-8 text-xs"
                placeholder="Notes"
                defaultValue={st?.notes ?? ""}
                onBlur={(e) =>
                  e.target.value !== (st?.notes ?? "") && update(r.id, { notes: e.target.value })
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
