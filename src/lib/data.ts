import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export type TableName = keyof Tables;
export type Row<T extends TableName> = Tables[T]["Row"];

export function useRows<T extends TableName>(table: T) {
  return useQuery({
    queryKey: ["rows", table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").limit(5000);
      if (error) throw error;
      return (data ?? []) as unknown as Row<T>[];
    },
  });
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (table: TableName) => qc.invalidateQueries({ queryKey: ["rows", table] });
}

export function useSettings() {
  const q = useRows("user_settings");
  const s = q.data?.[0];
  return {
    ...q,
    settings: {
      full_name: s?.full_name ?? "",
      age: s?.age ?? null,
      college: s?.college ?? "",
      degree: s?.degree ?? "",
      branch: s?.branch ?? "",
      semester: s?.semester ?? "",
      career_goal: s?.career_goal ?? "",
      bio: s?.bio ?? "",
      avatar_url: s?.avatar_url ?? "",
      linkedin_url: s?.linkedin_url ?? "",
      portfolio_url: s?.portfolio_url ?? "",
      timezone: s?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      start_date: s?.start_date ?? null,
      daily_goal_minutes: s?.daily_goal_minutes ?? 180,
      weekly_goal_minutes: s?.weekly_goal_minutes ?? 1080,
      dsa_target_minutes: s?.dsa_target_minutes ?? 60,
      learning_target_minutes: s?.learning_target_minutes ?? 90,
      project_target_minutes: s?.project_target_minutes ?? 90,
      github_username: s?.github_username ?? "",
      leetcode_username: s?.leetcode_username ?? "",
      preferred_language: s?.preferred_language ?? "Python",
      leetcode_daily_target: s?.leetcode_daily_target ?? 2,
      leetcode_weekly_target: s?.leetcode_weekly_target ?? 10,
    },
  };
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });
}
