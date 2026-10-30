import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
function matchPath(path: string) {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
  return router.matchRoutes(path);
}

describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const matches = matchPath("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("matches the login page at /auth", () => {
    const matches = matchPath("/auth");

    expect(matches.at(-1)?.routeId).toBe("/auth");
  });

  it("matches the dashboard at /dashboard", () => {
    const matches = matchPath("/dashboard");

    expect(matches.at(-1)?.routeId).toBe("/_authenticated/dashboard");
  });

  it("puts the dashboard behind the _authenticated gate", () => {
    const matches = matchPath("/dashboard");
    const routeIds = matches.map((m) => m.routeId);

    // The gate must come before the dashboard so its login check runs first.
    expect(routeIds).toContain("/_authenticated");
    expect(routeIds.indexOf("/_authenticated")).toBeLessThan(
      routeIds.indexOf("/_authenticated/dashboard"),
    );
  });

  it.each(["/courses", "/assignments"])("puts %s behind the gate", (path) => {
    expect(matchPath(path).map((m) => m.routeId)).toContain("/_authenticated");
  });

  it("does not put the login page behind the gate", () => {
    const routeIds = matchPath("/auth").map((m) => m.routeId);

    expect(routeIds).not.toContain("/_authenticated");
  });
});
