import { describe, expect, it } from "vitest";

describe("Profile validation & persistence structure", () => {
  it("validates age correctly", () => {
    const isValidAge = (age: number | null | undefined) => {
      if (age === null || age === undefined) return true;
      return age >= 10 && age <= 120;
    };

    expect(isValidAge(null)).toBe(true);
    expect(isValidAge(24)).toBe(true);
    expect(isValidAge(5)).toBe(false);
    expect(isValidAge(130)).toBe(false);
  });

  it("validates timezone parsing", () => {
    const isValidTz = (tz: string) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    };

    expect(isValidTz("Asia/Kolkata")).toBe(true);
    expect(isValidTz("America/New_York")).toBe(true);
    expect(isValidTz("UTC")).toBe(true);
    expect(isValidTz("Invalid/Timezone")).toBe(false);
  });

  it("formats user_settings payload safely without overwriting with empty strings", () => {
    const sanitizeProfile = (raw: Record<string, any>) => ({
      full_name: raw.full_name?.trim() || null,
      age: raw.age ? Number(raw.age) : null,
      college: raw.college?.trim() || null,
      degree: raw.degree?.trim() || null,
      branch: raw.branch?.trim() || null,
      semester: raw.semester?.trim() || null,
      career_goal: raw.career_goal?.trim() || null,
      bio: raw.bio?.trim() || null,
      avatar_url: raw.avatar_url?.trim() || null,
      linkedin_url: raw.linkedin_url?.trim() || null,
      portfolio_url: raw.portfolio_url?.trim() || null,
      github_username: raw.github_username?.trim() || null,
      leetcode_username: raw.leetcode_username?.trim() || null,
    });

    const sanitized = sanitizeProfile({
      full_name: "  Nikhil Chakre  ",
      age: "24",
      college: "Pune University",
      bio: "Software Engineer",
      avatar_url: "",
      linkedin_url: "   ",
    });

    expect(sanitized.full_name).toBe("Nikhil Chakre");
    expect(sanitized.age).toBe(24);
    expect(sanitized.college).toBe("Pune University");
    expect(sanitized.bio).toBe("Software Engineer");
    expect(sanitized.avatar_url).toBeNull();
    expect(sanitized.linkedin_url).toBeNull();
  });
});
