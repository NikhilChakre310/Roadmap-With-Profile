export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} · DevRoadmap` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · DevRoadmap` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
