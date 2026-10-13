export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      active_timers: {
        Row: {
          category: string
          description: string | null
          started_at: string
          topic_id: string | null
          user_id: string
        }
        Insert: {
          category: string
          description?: string | null
          started_at?: string
          topic_id?: string | null
          user_id?: string
        }
        Update: {
          category?: string
          description?: string | null
          started_at?: string
          topic_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      criterion_checks: {
        Row: {
          checked_at: string
          criterion_id: string
          user_id: string
        }
        Insert: {
          checked_at?: string
          criterion_id: string
          user_id?: string
        }
        Update: {
          checked_at?: string
          criterion_id?: string
          user_id?: string
        }
        Relationships: []
      }
      dsa_problems: {
        Row: {
          attempts: number
          complexity: string | null
          confidence: number | null
          created_at: string
          date_attempted: string | null
          date_solved: string | null
          difficulty: string
          id: string
          language: string | null
          minutes: number | null
          mistakes: string | null
          next_revision: string | null
          platform: string
          problem_id: string | null
          solution_notes: string | null
          solution_url: string | null
          source: string
          status: string
          title: string
          topic: string | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          complexity?: string | null
          confidence?: number | null
          created_at?: string
          date_attempted?: string | null
          date_solved?: string | null
          difficulty?: string
          id?: string
          language?: string | null
          minutes?: number | null
          mistakes?: string | null
          next_revision?: string | null
          platform?: string
          problem_id?: string | null
          solution_notes?: string | null
          solution_url?: string | null
          source?: string
          status?: string
          title: string
          topic?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Update: {
          attempts?: number
          complexity?: string | null
          confidence?: number | null
          created_at?: string
          date_attempted?: string | null
          date_solved?: string | null
          difficulty?: string
          id?: string
          language?: string | null
          minutes?: number | null
          mistakes?: string | null
          next_revision?: string | null
          platform?: string
          problem_id?: string | null
          solution_notes?: string | null
          solution_url?: string | null
          source?: string
          status?: string
          title?: string
          topic?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      github_repos: {
        Row: {
          created_at: string
          deploy_url: string | null
          description: string | null
          forks: number | null
          full_name: string
          gh_created_at: string | null
          gh_updated_at: string | null
          id: string
          language: string | null
          month_id: number | null
          source: string
          stars: number | null
          synced_at: string | null
          topic_id: string | null
          url: string
          user_id: string
          visibility: string | null
        }
        Insert: {
          created_at?: string
          deploy_url?: string | null
          description?: string | null
          forks?: number | null
          full_name: string
          gh_created_at?: string | null
          gh_updated_at?: string | null
          id?: string
          language?: string | null
          month_id?: number | null
          source?: string
          stars?: number | null
          synced_at?: string | null
          topic_id?: string | null
          url: string
          user_id?: string
          visibility?: string | null
        }
        Update: {
          created_at?: string
          deploy_url?: string | null
          description?: string | null
          forks?: number | null
          full_name?: string
          gh_created_at?: string | null
          gh_updated_at?: string | null
          id?: string
          language?: string | null
          month_id?: number | null
          source?: string
          stars?: number | null
          synced_at?: string | null
          topic_id?: string | null
          url?: string
          user_id?: string
          visibility?: string | null
        }
        Relationships: []
      }
      milestone_progress: {
        Row: {
          actual_hours: number | null
          confirmed_complete: boolean
          deadline: string | null
          demo_url: string | null
          id: string
          lessons: string | null
          live_url: string | null
          milestone_id: number
          readme_done: boolean
          repo_url: string | null
          start_date: string | null
          status: string
          tech_stack: string | null
          tests_done: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_hours?: number | null
          confirmed_complete?: boolean
          deadline?: string | null
          demo_url?: string | null
          id?: string
          lessons?: string | null
          live_url?: string | null
          milestone_id: number
          readme_done?: boolean
          repo_url?: string | null
          start_date?: string | null
          status?: string
          tech_stack?: string | null
          tests_done?: boolean
          updated_at?: string
          user_id?: string
        }
        Update: {
          actual_hours?: number | null
          confirmed_complete?: boolean
          deadline?: string | null
          demo_url?: string | null
          id?: string
          lessons?: string | null
          live_url?: string | null
          milestone_id?: number
          readme_done?: boolean
          repo_url?: string | null
          start_date?: string | null
          status?: string
          tech_stack?: string | null
          tests_done?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_tasks: {
        Row: {
          created_at: string
          done: boolean
          done_at: string | null
          id: string
          milestone_id: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          done_at?: string | null
          id?: string
          milestone_id: number
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          done_at?: string | null
          id?: string
          milestone_id?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      resource_status: {
        Row: {
          notes: string | null
          rating: number | null
          resource_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          notes?: string | null
          rating?: number | null
          resource_id: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          notes?: string | null
          rating?: number | null
          resource_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          category: string
          commit_url: string | null
          confidence: number | null
          created_at: string
          date: string
          description: string | null
          end_at: string | null
          id: string
          minutes: number
          month_id: number | null
          notes: string | null
          planned_minutes: number | null
          resource_url: string | null
          start_at: string | null
          status: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          commit_url?: string | null
          confidence?: number | null
          created_at?: string
          date: string
          description?: string | null
          end_at?: string | null
          id?: string
          minutes: number
          month_id?: number | null
          notes?: string | null
          planned_minutes?: number | null
          resource_url?: string | null
          start_at?: string | null
          status?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string
          commit_url?: string | null
          confidence?: number | null
          created_at?: string
          date?: string
          description?: string | null
          end_at?: string | null
          id?: string
          minutes?: number
          month_id?: number | null
          notes?: string | null
          planned_minutes?: number | null
          resource_url?: string | null
          start_at?: string | null
          status?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          created_at: string
          id: string
          message: string | null
          ok: boolean
          service: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          ok: boolean
          service: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          ok?: boolean
          service?: string
          user_id?: string
        }
        Relationships: []
      }
      topic_progress: {
        Row: {
          actual_minutes: number
          completed_at: string | null
          confidence: number | null
          id: string
          next_revision: string | null
          notes: string | null
          revision_notes: string | null
          status: string
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_minutes?: number
          completed_at?: string | null
          confidence?: number | null
          id?: string
          next_revision?: string | null
          notes?: string | null
          revision_notes?: string | null
          status?: string
          topic_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          actual_minutes?: number
          completed_at?: string | null
          confidence?: number | null
          id?: string
          next_revision?: string | null
          notes?: string | null
          revision_notes?: string | null
          status?: string
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      topic_submissions: {
        Row: {
          actual_hours: number | null
          completion_date: string | null
          created_at: string
          demo_url: string | null
          description: string | null
          est_hours: number | null
          id: string
          lessons: string | null
          live_url: string | null
          notes: string | null
          repo_url: string | null
          slot: number
          start_date: string | null
          status: string
          technologies: string | null
          title: string | null
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_hours?: number | null
          completion_date?: string | null
          created_at?: string
          demo_url?: string | null
          description?: string | null
          est_hours?: number | null
          id?: string
          lessons?: string | null
          live_url?: string | null
          notes?: string | null
          repo_url?: string | null
          slot: number
          start_date?: string | null
          status?: string
          technologies?: string | null
          title?: string | null
          topic_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          actual_hours?: number | null
          completion_date?: string | null
          created_at?: string
          demo_url?: string | null
          description?: string | null
          est_hours?: number | null
          id?: string
          lessons?: string | null
          live_url?: string | null
          notes?: string | null
          repo_url?: string | null
          slot?: number
          start_date?: string | null
          status?: string
          technologies?: string | null
          title?: string | null
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          avatar_url: string | null
          age: number | null
          bio: string | null
          branch: string | null
          career_goal: string | null
          college: string | null
          daily_goal_minutes: number
          degree: string | null
          dsa_target_minutes: number
          full_name: string | null
          github_username: string | null
          learning_target_minutes: number
          leetcode_daily_target: number | null
          leetcode_username: string | null
          leetcode_weekly_target: number | null
          linkedin_url: string | null
          portfolio_url: string | null
          preferred_language: string | null
          project_target_minutes: number
          semester: string | null
          start_date: string
          timezone: string
          updated_at: string
          user_id: string
          weekly_goal_minutes: number
        }
        Insert: {
          avatar_url?: string | null
          age?: number | null
          bio?: string | null
          branch?: string | null
          career_goal?: string | null
          college?: string | null
          daily_goal_minutes?: number
          degree?: string | null
          dsa_target_minutes?: number
          full_name?: string | null
          github_username?: string | null
          learning_target_minutes?: number
          leetcode_daily_target?: number | null
          leetcode_username?: string | null
          leetcode_weekly_target?: number | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          preferred_language?: string | null
          project_target_minutes?: number
          semester?: string | null
          start_date?: string
          timezone?: string
          updated_at?: string
          user_id?: string
          weekly_goal_minutes?: number
        }
        Update: {
          avatar_url?: string | null
          age?: number | null
          bio?: string | null
          branch?: string | null
          career_goal?: string | null
          college?: string | null
          daily_goal_minutes?: number
          degree?: string | null
          dsa_target_minutes?: number
          full_name?: string | null
          github_username?: string | null
          learning_target_minutes?: number
          leetcode_daily_target?: number | null
          leetcode_username?: string | null
          leetcode_weekly_target?: number | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          preferred_language?: string | null
          project_target_minutes?: number
          semester?: string | null
          start_date?: string
          timezone?: string
          updated_at?: string
          user_id?: string
          weekly_goal_minutes?: number
        }
        Relationships: []
      }
      weekly_reviews: {
        Row: {
          achievements: string | null
          difficult: string | null
          id: string
          lessons: string | null
          mistakes: string | null
          priorities: string[]
          revisit: string | null
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          achievements?: string | null
          difficult?: string | null
          id?: string
          lessons?: string | null
          mistakes?: string | null
          priorities?: string[]
          revisit?: string | null
          updated_at?: string
          user_id?: string
          week_start: string
        }
        Update: {
          achievements?: string | null
          difficult?: string | null
          id?: string
          lessons?: string | null
          mistakes?: string | null
          priorities?: string[]
          revisit?: string | null
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
