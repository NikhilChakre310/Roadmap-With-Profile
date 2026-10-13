import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Bar, PageHeader } from "@/components/AppShell";
import { setTopicStatus, TopicDetail } from "@/components/TopicDetail";
import { MILESTONES, MONTHS, subtopicsOf, type Topic } from "@/data/catalog";
import { useInvalidate } from "@/lib/data";
import { meta } from "@/lib/meta";
import { useStats } from "@/lib/stats";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/roadmap")({
  head: () =>
    meta(
      "My Roadmap",
      "The full eight-month curriculum with topic-level tracking and project slots.",
    ),
  component: Roadmap,
});

const STATUS_COLOR: Record<string, string> = {
  Completed: "text-success",
  "In Progress": "text-primary",
  "Needs Revision": "text-warning",
};

function Roadmap() {
  const s = useStats();
  const inv = useInvalidate();
  const [openMonth, setOpenMonth] = useState<number | null>(1);
  const [openTopic, setOpenTopic] = useState<string | null>(null);
  const [sel, setSel] = useState<Topic | null>(null);
  const slotCount = (id: string) =>
    s.subs.filter((x) => x.topic_id === id && (x.repo_url || x.live_url || x.demo_url)).length;

  const Row = ({ t, sub }: { t: Topic; sub?: boolean }) => {
    const st = s.pmap.get(t.id)?.status ?? "Not Started";
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent",
          sub && "pl-8",
        )}
      >
        <Checkbox
          checked={st === "Completed"}
          onCheckedChange={async (c) => {
            await setTopicStatus(t.id, c ? "Completed" : "In Progress");
            inv("topic_progress");
          }}
          aria-label={`Mark ${t.title} complete`}
        />
        <button className="flex-1 text-left text-sm" onClick={() => setSel(t)}>
          {t.title}
        </button>
        <span
          className={cn("hidden text-xs sm:inline", STATUS_COLOR[st] ?? "text-muted-foreground")}
        >
          {st}
        </span>
        <span className="font-mono text-xs text-muted-foreground" title="Project slots with links">
          {slotCount(t.id)}/3
        </span>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="My Roadmap"
        sub={`${s.topicsTotal} topics & subtopics · ${s.completed} completed · ${s.totalSlots} project slots`}
      />
      <div className="space-y-3">
        {MONTHS.map((m) => {
          const ms = s.months[m.id - 1]!;
          const open = openMonth === m.id;
          return (
            <div key={m.id} className="panel">
              <button
                className="flex w-full items-center gap-4 p-4 text-left"
                onClick={() => setOpenMonth(open ? null : m.id)}
              >
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <div className="flex-1">
                  <div className="stat-label">Month {m.id}</div>
                  <div className="font-display font-semibold">{m.title}</div>
                  <div className="text-xs text-muted-foreground">{m.goal}</div>
                </div>
                <div className="w-32 text-right">
                  <div className="font-mono text-sm">{ms.progress}%</div>
                  <Bar value={ms.progress} className="mt-1" />
                </div>
              </button>
              {open && (
                <div className="space-y-2 border-t p-4">
                  {m.topics.map((t, i) => {
                    const subs = subtopicsOf(t.id);
                    const done = subs.filter(
                      (x) => s.pmap.get(x.id)?.status === "Completed",
                    ).length;
                    const to = openTopic === t.id;
                    return (
                      <div key={t.id} className="rounded-md border">
                        <div className="flex items-center gap-2 p-2">
                          <button
                            onClick={() => setOpenTopic(to ? null : t.id)}
                            aria-label="Toggle subtopics"
                          >
                            {to ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          <span className="stat-label">{i + 1}</span>
                          <div className="flex-1">
                            <Row t={t} />
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">
                            {done}/{subs.length}
                          </span>
                        </div>
                        {to && (
                          <div className="border-t p-2">
                            {subs.map((x) => (
                              <Row key={x.id} t={x} sub />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="rounded-md border border-dashed p-3 text-sm">
                    <div className="stat-label">Milestone project</div>
                    <div className="font-medium">{MILESTONES[m.id - 1]!.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {ms.critDone}/{ms.critTotal} mandatory criteria · {m.completionRule}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <TopicDetail topic={sel} onClose={() => setSel(null)} />
    </div>
  );
}
