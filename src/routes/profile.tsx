import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  Github,
  Globe,
  GraduationCap,
  Linkedin,
  MapPin,
  Save,
  Sparkles,
  Target,
  Trophy,
  User,
  Flame,
  Code2,
  Calendar,
  Clock,
  BookOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Stat } from "@/components/AppShell";
import { Heatmap } from "@/components/Heatmap";
import { useInvalidate, useSettings } from "@/lib/data";
import { useStats } from "@/lib/stats";
import { meta } from "@/lib/meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/profile")({
  head: () =>
    meta(
      "Developer Profile",
      "Manage your personal developer profile, education, goals, external links and track activity.",
    ),
  component: ProfilePage,
});

function ProfilePage() {
  const { settings, data } = useSettings();
  const stats = useStats();
  const inv = useInvalidate();

  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  // Sync form when database values are loaded or changed
  useEffect(() => {
    setForm(settings);
  }, [data?.[0]?.updated_at, settings.full_name]); // eslint-disable-line react-hooks/exhaustive-deps

  const setField = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    // Basic validation
    if (form.age !== null && form.age !== undefined && form.age !== ("" as any)) {
      const ageNum = Number(form.age);
      if (isNaN(ageNum) || ageNum < 10 || ageNum > 120) {
        setSaving(false);
        return void toast.error("Age must be between 10 and 120 years.");
      }
    }

    try {
      if (form.timezone) {
        new Intl.DateTimeFormat("en", { timeZone: form.timezone });
      }
    } catch {
      setSaving(false);
      return void toast.error("Invalid timezone format.");
    }

    const payload = {
      ...form,
      age: form.age ? Number(form.age) : null,
      full_name: form.full_name?.trim() || null,
      college: form.college?.trim() || null,
      degree: form.degree?.trim() || null,
      branch: form.branch?.trim() || null,
      semester: form.semester?.trim() || null,
      career_goal: form.career_goal?.trim() || null,
      bio: form.bio?.trim() || null,
      avatar_url: form.avatar_url?.trim() || null,
      linkedin_url: form.linkedin_url?.trim() || null,
      portfolio_url: form.portfolio_url?.trim() || null,
      github_username: form.github_username?.trim() || null,
      leetcode_username: form.leetcode_username?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("user_settings")
      .upsert(payload, { onConflict: "user_id" });

    setSaving(false);

    if (error) {
      console.error("Failed to save profile:", error);
      toast.error(`Failed to save profile: ${error.message}`);
      return;
    }

    toast.success("Profile saved successfully to database!");
    inv("user_settings");
  }

  const h = (m: number) => `${(m / 60).toFixed(1)}h`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Developer Profile"
        sub="Your personal identity, educational background, career goals, and synchronized learning records."
      />

      {/* Profile Overview Banner */}
      <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/30 bg-muted">
              {form.avatar_url ? (
                <img
                  src={form.avatar_url}
                  alt={form.full_name || "Developer"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <User className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-bold">
                  {form.full_name || "Developer"}
                </h2>
                {form.age && (
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                    {form.age} yrs
                  </span>
                )}
                {form.preferred_language && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {form.preferred_language}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {form.career_goal || "Test Engineer → Full Stack → AI Engineer"}
              </p>
              {(form.college || form.degree) && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {[form.degree, form.branch, form.college, form.semester]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {form.bio && (
                <p className="mt-2 max-w-xl text-sm text-foreground/90 leading-relaxed">
                  {form.bio}
                </p>
              )}
            </div>
          </div>

          {/* Social Profiles & External Links */}
          <div className="flex flex-wrap items-center gap-2 self-start">
            {form.github_username && (
              <a
                href={`https://github.com/${form.github_username}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium transition hover:border-primary hover:text-primary"
              >
                <Github className="h-4 w-4" />
                <span>@{form.github_username}</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            )}
            {form.leetcode_username && (
              <a
                href={`https://leetcode.com/u/${form.leetcode_username}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-warning transition hover:border-warning"
              >
                <Code2 className="h-4 w-4" />
                <span>LeetCode</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            )}
            {form.linkedin_url && (
              <a
                href={form.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-blue-500 transition hover:border-blue-500"
              >
                <Linkedin className="h-4 w-4" />
                <span>LinkedIn</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            )}
            {form.portfolio_url && (
              <a
                href={form.portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-emerald-500 transition hover:border-emerald-500"
              >
                <Globe className="h-4 w-4" />
                <span>Portfolio</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            )}
          </div>
        </div>

        {/* Mini stats row */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-warning" />
            <span className="text-xs text-muted-foreground">Streak:</span>
            <span className="text-xs font-semibold">{stats.streak.current} days</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Focused:</span>
            <span className="text-xs font-semibold">{h(stats.totalMinutes)}</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Topics:</span>
            <span className="text-xs font-semibold">{stats.completed} / {stats.topicsTotal}</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Milestones:</span>
            <span className="text-xs font-semibold">{stats.milestonesDone} / 8</span>
          </div>
        </div>
      </div>

      {/* GitHub-Style Activity Heatmap on Profile */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Learning Activity Heatmap</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {stats.totalMinutes > 0
              ? `${stats.sessions.length} sessions logged · ${h(stats.totalMinutes)} total`
              : "No activity recorded yet"}
          </span>
        </div>
        <Heatmap byDay={stats.byDay} today={stats.today} weeks={52} />
      </div>

      {/* Edit Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal & Career Information */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold text-base">Personal & Career Details</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                placeholder="e.g. Nikhil Chakre"
                value={form.full_name || ""}
                onChange={(e) => setField("full_name", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={10}
                max={120}
                placeholder="e.g. 23"
                value={form.age ?? ""}
                onChange={(e) => setField("age", e.target.value ? Number(e.target.value) : (null as any))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="career_goal">Career Goal / Target Role</Label>
              <Input
                id="career_goal"
                placeholder="e.g. Full Stack & AI Engineer"
                value={form.career_goal || ""}
                onChange={(e) => setField("career_goal", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="avatar_url">Avatar Image URL</Label>
              <Input
                id="avatar_url"
                type="url"
                placeholder="https://github.com/username.png"
                value={form.avatar_url || ""}
                onChange={(e) => setField("avatar_url", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="preferred_language">Primary Programming Language</Label>
              <Input
                id="preferred_language"
                placeholder="Python / TypeScript / Java"
                value={form.preferred_language || ""}
                onChange={(e) => setField("preferred_language", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                placeholder="Asia/Kolkata"
                value={form.timezone || ""}
                onChange={(e) => setField("timezone", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <Label htmlFor="bio">Bio & Learning Philosophy</Label>
            <Textarea
              id="bio"
              rows={3}
              placeholder="Tell about yourself, your engineering journey, and what drives you daily..."
              value={form.bio || ""}
              onChange={(e) => setField("bio", e.target.value)}
            />
          </div>
        </div>

        {/* Education Background */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold text-base">Education & Academics</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="college">College / University</Label>
              <Input
                id="college"
                placeholder="e.g. Pune University"
                value={form.college || ""}
                onChange={(e) => setField("college", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="degree">Degree</Label>
              <Input
                id="degree"
                placeholder="e.g. B.Tech / B.E. / BCA"
                value={form.degree || ""}
                onChange={(e) => setField("degree", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="branch">Branch / Major</Label>
              <Input
                id="branch"
                placeholder="e.g. Computer Science"
                value={form.branch || ""}
                onChange={(e) => setField("branch", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="semester">Current Semester</Label>
              <Input
                id="semester"
                placeholder="e.g. 7th Semester / Graduate"
                value={form.semester || ""}
                onChange={(e) => setField("semester", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Coding Profiles & Social Links */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Globe className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold text-base">Coding Profiles & Social Handles</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="github_username">GitHub Username</Label>
              <div className="relative">
                <Github className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="github_username"
                  className="pl-9"
                  placeholder="octocat"
                  value={form.github_username || ""}
                  onChange={(e) => setField("github_username", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="leetcode_username">LeetCode Username</Label>
              <div className="relative">
                <Code2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="leetcode_username"
                  className="pl-9"
                  placeholder="tourist"
                  value={form.leetcode_username || ""}
                  onChange={(e) => setField("leetcode_username", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="linkedin_url"
                  className="pl-9"
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={form.linkedin_url || ""}
                  onChange={(e) => setField("linkedin_url", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="portfolio_url">Personal Portfolio Website URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="portfolio_url"
                  className="pl-9"
                  type="url"
                  placeholder="https://yourportfolio.dev"
                  value={form.portfolio_url || ""}
                  onChange={(e) => setField("portfolio_url", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Learning Targets & Goals */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold text-base">Daily & Weekly Study Goals</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="daily_goal">Daily Goal (Minutes)</Label>
              <Input
                id="daily_goal"
                type="number"
                min={30}
                max={960}
                value={form.daily_goal_minutes}
                onChange={(e) => setField("daily_goal_minutes", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Default: 180 min (3h)</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="weekly_goal">Weekly Goal (Minutes)</Label>
              <Input
                id="weekly_goal"
                type="number"
                min={180}
                max={6000}
                value={form.weekly_goal_minutes}
                onChange={(e) => setField("weekly_goal_minutes", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Default: 1080 min (18h)</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="start_date">Roadmap Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={form.start_date || ""}
                onChange={(e) => setField("start_date", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Sets your month index (1..8)</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dsa_target">DSA Target (Minutes/day)</Label>
              <Input
                id="dsa_target"
                type="number"
                min={15}
                value={form.dsa_target_minutes}
                onChange={(e) => setField("dsa_target_minutes", Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="learning_target">Lessons Target (Minutes/day)</Label>
              <Input
                id="learning_target"
                type="number"
                min={15}
                value={form.learning_target_minutes}
                onChange={(e) => setField("learning_target_minutes", Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="project_target">Projects Target (Minutes/day)</Label>
              <Input
                id="project_target"
                type="number"
                min={15}
                value={form.project_target_minutes}
                onChange={(e) => setField("project_target_minutes", Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Save button bar */}
        <div className="sticky bottom-4 flex items-center justify-between rounded-xl border bg-background/90 p-4 backdrop-blur shadow-lg">
          <p className="text-xs text-muted-foreground">
            Changes will be permanently saved to your PostgreSQL database.
          </p>
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving Changes…" : "Save Profile & Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
