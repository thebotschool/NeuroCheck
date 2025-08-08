export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      messages_queue: {
        Row: {
          created_at: string
          email_sent: boolean | null
          error_message: string | null
          id: number
          telegram_sent: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email_sent?: boolean | null
          error_message?: string | null
          id?: number
          telegram_sent?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email_sent?: boolean | null
          error_message?: string | null
          id?: number
          telegram_sent?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number | null
          payment_id: string
          status: string | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          payment_id: string
          status?: string | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          payment_id?: string
          status?: string | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          used: boolean
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          used: boolean
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          used?: boolean
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      test_results: {
        Row: {
          age: number | null
          cpt_result: Json | null
          created_at: string
          email: string | null
          feedback_html: string | null
          gonogo_result: Json | null
          hand_used: string | null
          id: string
          memory_result: Json | null
          result_summary: string | null
          sent_to_telegram: boolean | null
          summary_key: string | null
          test_session_id: string | null
          user_data_id: string | null
          user_id: string | null
        }
        Insert: {
          age?: number | null
          cpt_result?: Json | null
          created_at?: string
          email?: string | null
          feedback_html?: string | null
          gonogo_result?: Json | null
          hand_used?: string | null
          id?: string
          memory_result?: Json | null
          result_summary?: string | null
          sent_to_telegram?: boolean | null
          summary_key?: string | null
          test_session_id?: string | null
          user_data_id?: string | null
          user_id?: string | null
        }
        Update: {
          age?: number | null
          cpt_result?: Json | null
          created_at?: string
          email?: string | null
          feedback_html?: string | null
          gonogo_result?: Json | null
          hand_used?: string | null
          id?: string
          memory_result?: Json | null
          result_summary?: string | null
          sent_to_telegram?: boolean | null
          summary_key?: string | null
          test_session_id?: string | null
          user_data_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_results_user_data_id_fkey"
            columns: ["user_data_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      test_sessions: {
        Row: {
          completed_at: string | null
          cpt_results: Json | null
          current_step: number | null
          gonogo_results: Json | null
          id: string
          is_completed: boolean | null
          memory_results: Json | null
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          cpt_results?: Json | null
          current_step?: number | null
          gonogo_results?: Json | null
          id?: string
          is_completed?: boolean | null
          memory_results?: Json | null
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          cpt_results?: Json | null
          current_step?: number | null
          gonogo_results?: Json | null
          id?: string
          is_completed?: boolean | null
          memory_results?: Json | null
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          age: number | null
          child_name: string | null
          consent_agreed: boolean
          created_at: string
          email: string | null
          id: string
          user_id: string
        }
        Insert: {
          age?: number | null
          child_name?: string | null
          consent_agreed?: boolean
          created_at?: string
          email?: string | null
          id?: string
          user_id: string
        }
        Update: {
          age?: number | null
          child_name?: string | null
          consent_agreed?: boolean
          created_at?: string
          email?: string | null
          id?: string
          user_id?: string
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
