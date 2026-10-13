import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  const routes = [
    "/",
    "/profile",
    "/roadmap",
    "/daily",
    "/dsa",
    "/projects",
    "/github",
    "/resources",
    "/reviews",
    "/analytics",
    "/settings",
    "/login",
  ];

  for (const route of routes) {
    it(`matches a page for ${route} without falling back to not found`, () => {
      const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
      const matches = router.matchRoutes(route);
      expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    });
  }
});
