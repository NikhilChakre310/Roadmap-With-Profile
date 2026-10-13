import raw from "./curriculum.json";

type RawMonth = {
  n: number;
  title: string;
  goal: string;
  completionRule?: string;
  topics: { title: string; subs: string[] }[];
  resources: { name: string; url: string }[];
  project: { title: string; description: string; criteria: string[]; bonus: string[] };
};

export type Topic = {
  id: string;
  monthId: number;
  parentId: string | null;
  title: string;
  estHours: number;
  suggestions: [string, string, string];
};
export type Resource = {
  id: string;
  monthId: number;
  title: string;
  type: string;
  url: string;
  verification: "Needs Verification";
};
export type Criterion = { id: string; kind: "mandatory" | "bonus"; text: string };
export type Milestone = {
  id: number;
  monthId: number;
  title: string;
  description: string;
  criteria: Criterion[];
};
export type Month = {
  id: number;
  title: string;
  goal: string;
  completionRule: string;
  topics: Topic[]; // top-level topics
};

const months = raw as RawMonth[];

export const TOPICS: Topic[] = [];
export const RESOURCES: Resource[] = [];
export const MILESTONES: Milestone[] = [];
export const MONTHS: Month[] = [];

function suggest(title: string): [string, string, string] {
  return [
    `Practice: a small script that exercises "${title}"`,
    `Intermediate: a mini tool applying "${title}" to a real task`,
    `Portfolio: a polished, documented app showcasing "${title}"`,
  ];
}

function resourceType(url: string) {
  if (url.includes("youtube.com")) return "YouTube channel";
  if (url.includes("leetcode") || url.includes("neetcode") || url.includes("visualgo"))
    return "Practice platform";
  if (url.includes("docs") || url.includes("tutorial") || url.includes(".org/"))
    return "Official documentation";
  return "Course";
}

for (const m of months) {
  const top: Topic[] = [];
  m.topics.forEach((t, i) => {
    const id = `m${m.n}-t${i + 1}`;
    const topic: Topic = {
      id,
      monthId: m.n,
      parentId: null,
      title: t.title,
      estHours: Math.max(2, t.subs.length * 2),
      suggestions: suggest(t.title),
    };
    top.push(topic);
    TOPICS.push(topic);
    t.subs.forEach((s, j) =>
      TOPICS.push({
        id: `${id}-s${j + 1}`,
        monthId: m.n,
        parentId: id,
        title: s,
        estHours: 2,
        suggestions: suggest(s),
      }),
    );
  });
  m.resources.forEach((r, i) =>
    RESOURCES.push({
      id: `m${m.n}-r${i + 1}`,
      monthId: m.n,
      title: r.name,
      type: resourceType(r.url),
      url: r.url,
      verification: "Needs Verification",
    }),
  );
  MILESTONES.push({
    id: m.n,
    monthId: m.n,
    title: m.project.title,
    description: m.project.description,
    criteria: [
      ...m.project.criteria.map((c, i) => ({
        id: `m${m.n}-c${i + 1}`,
        kind: "mandatory" as const,
        text: c,
      })),
      ...m.project.bonus.map((c, i) => ({
        id: `m${m.n}-b${i + 1}`,
        kind: "bonus" as const,
        text: c,
      })),
    ],
  });
  MONTHS.push({
    id: m.n,
    title: m.title,
    goal: m.goal,
    completionRule:
      m.completionRule ??
      `Month ${m.n} is complete after its required topics and mandatory milestone criteria are satisfied and you confirm completion.`,
    topics: top,
  });
}

export const topicById = new Map(TOPICS.map((t) => [t.id, t]));
export const subtopicsOf = (id: string) => TOPICS.filter((t) => t.parentId === id);
export const TOTAL_SLOTS = TOPICS.length * 3;

export const SESSION_CATEGORIES = [
  "DSA Practice",
  "Learning or Video Lessons",
  "Project Development",
  "Revision",
  "Documentation Reading",
  "Interview Preparation",
  "Technical Writing",
  "Other Learning",
] as const;
