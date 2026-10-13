import { describe, expect, it } from "vitest";
import { canCompleteMilestone, isSafeUrl, monthProgress, streaks, weekStart } from "./calc";
import { MILESTONES, MONTHS, TOPICS, TOTAL_SLOTS } from "@/data/catalog";

describe("curriculum", () => {
  it("has 8 months and 8 milestones", () => {
    expect(MONTHS).toHaveLength(8);
    expect(MILESTONES).toHaveLength(8);
  });
  it("gives every topic and subtopic exactly 3 slots", () => {
    expect(TOTAL_SLOTS).toBe(TOPICS.length * 3);
  });
  it("month 1 milestone is the calculator with 15 mandatory criteria", () => {
    expect(MILESTONES[0]!.title).toBe("Simple Calculator Application");
    expect(MILESTONES[0]!.criteria.filter((c) => c.kind === "mandatory")).toHaveLength(15);
  });
});

describe("streaks", () => {
  it("does not count missed days", () => {
    expect(streaks(["2026-10-10", "2026-10-12", "2026-10-13"], "2026-10-13")).toEqual({
      current: 2,
      longest: 2,
    });
  });
  it("is zero when nothing recorded today or yesterday", () => {
    expect(streaks(["2026-10-01"], "2026-10-13").current).toBe(0);
  });
  it("keeps the streak alive if today is not logged yet", () => {
    expect(streaks(["2026-10-11", "2026-10-12"], "2026-10-13").current).toBe(2);
  });
});

describe("milestone completion", () => {
  it("requires all mandatory criteria", () => {
    expect(canCompleteMilestone(["a", "b"], new Set(["a"]), true)).toBe(false);
  });
  it("requires explicit confirmation", () => {
    expect(canCompleteMilestone(["a"], new Set(["a"]), false)).toBe(false);
    expect(canCompleteMilestone(["a"], new Set(["a"]), true)).toBe(true);
  });
});

describe("misc", () => {
  it("rejects unsafe url protocols", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("https://github.com/x/y")).toBe(true);
  });
  it("month progress weights topics 70 / criteria 30", () => {
    expect(monthProgress(10, 10, 0, 15)).toBe(70);
  });
  it("week starts Monday", () => {
    expect(weekStart("2026-10-13")).toBe("2026-10-12");
  });
});
