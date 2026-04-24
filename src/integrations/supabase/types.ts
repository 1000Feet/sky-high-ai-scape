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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      campaign_email_log: {
        Row: {
          attempt_count: number
          batch_id: string | null
          created_at: string
          error_message: string | null
          id: string
          language: string | null
          prospect_id: string | null
          recipient_email: string
          sent_at: string | null
          status: string
          subject: string | null
        }
        Insert: {
          attempt_count?: number
          batch_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          language?: string | null
          prospect_id?: string | null
          recipient_email: string
          sent_at?: string | null
          status: string
          subject?: string | null
        }
        Update: {
          attempt_count?: number
          batch_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          language?: string | null
          prospect_id?: string | null
          recipient_email?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_email_log_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "email_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      client_signups: {
        Row: {
          business_type: string | null
          created_at: string
          desired_services: string
          email: string
          id: string
          name: string
          phone: string | null
          social_media: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          business_type?: string | null
          created_at?: string
          desired_services: string
          email: string
          id?: string
          name: string
          phone?: string | null
          social_media?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          business_type?: string | null
          created_at?: string
          desired_services?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          social_media?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      email_batches: {
        Row: {
          completed_at: string | null
          consecutive_failures: number
          cursor: number
          failed_count: number
          id: string
          last_error: string | null
          last_heartbeat_at: string | null
          paused_reason: string | null
          paused_until: string | null
          prospect_ids: Json
          sent_count: number
          skipped_count: number
          started_at: string
          status: string
          stop_requested: boolean
          total: number
        }
        Insert: {
          completed_at?: string | null
          consecutive_failures?: number
          cursor?: number
          failed_count?: number
          id?: string
          last_error?: string | null
          last_heartbeat_at?: string | null
          paused_reason?: string | null
          paused_until?: string | null
          prospect_ids?: Json
          sent_count?: number
          skipped_count?: number
          started_at?: string
          status?: string
          stop_requested?: boolean
          total?: number
        }
        Update: {
          completed_at?: string | null
          consecutive_failures?: number
          cursor?: number
          failed_count?: number
          id?: string
          last_error?: string | null
          last_heartbeat_at?: string | null
          paused_reason?: string | null
          paused_until?: string | null
          prospect_ids?: Json
          sent_count?: number
          skipped_count?: number
          started_at?: string
          status?: string
          stop_requested?: boolean
          total?: number
        }
        Relationships: []
      }
      potential_clients: {
        Row: {
          address: string | null
          category: string | null
          city: string | null
          contacted: boolean
          created_at: string
          email: string | null
          google_id: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          rating: number | null
          reviews_count: number | null
          source_query: string | null
          state: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          city?: string | null
          contacted?: boolean
          created_at?: string
          email?: string | null
          google_id?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          reviews_count?: number | null
          source_query?: string | null
          state?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          city?: string | null
          contacted?: boolean
          created_at?: string
          email?: string | null
          google_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          reviews_count?: number | null
          source_query?: string | null
          state?: string | null
          website?: string | null
        }
        Relationships: []
      }
      website_audits: {
        Row: {
          agent_session_id: string | null
          business_name: string
          completed_at: string | null
          created_at: string
          design_score: number | null
          full_report: string | null
          id: string
          lead_id: string | null
          mobile_score: number | null
          overall_score: number | null
          quick_verdict: string | null
          seo_score: number | null
          status: string
          website_url: string
        }
        Insert: {
          agent_session_id?: string | null
          business_name: string
          completed_at?: string | null
          created_at?: string
          design_score?: number | null
          full_report?: string | null
          id?: string
          lead_id?: string | null
          mobile_score?: number | null
          overall_score?: number | null
          quick_verdict?: string | null
          seo_score?: number | null
          status?: string
          website_url: string
        }
        Update: {
          agent_session_id?: string | null
          business_name?: string
          completed_at?: string | null
          created_at?: string
          design_score?: number | null
          full_report?: string | null
          id?: string
          lead_id?: string | null
          mobile_score?: number | null
          overall_score?: number | null
          quick_verdict?: string | null
          seo_score?: number | null
          status?: string
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_audits_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "potential_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      website_requests: {
        Row: {
          business_name: string
          business_type: string | null
          color_palette: string
          created_at: string
          demo_deployed_at: string | null
          demo_site_id: string | null
          demo_status: string
          demo_url: string | null
          email: string
          generated_code: string | null
          generation_completed_at: string | null
          generation_error: string | null
          generation_session_id: string | null
          generation_started_at: string | null
          generation_status: string
          id: string
          logo_url: string | null
          mockup_url: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string
        }
        Insert: {
          business_name: string
          business_type?: string | null
          color_palette: string
          created_at?: string
          demo_deployed_at?: string | null
          demo_site_id?: string | null
          demo_status?: string
          demo_url?: string | null
          email: string
          generated_code?: string | null
          generation_completed_at?: string | null
          generation_error?: string | null
          generation_session_id?: string | null
          generation_started_at?: string | null
          generation_status?: string
          id?: string
          logo_url?: string | null
          mockup_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Update: {
          business_name?: string
          business_type?: string | null
          color_palette?: string
          created_at?: string
          demo_deployed_at?: string | null
          demo_site_id?: string | null
          demo_status?: string
          demo_url?: string | null
          email?: string
          generated_code?: string | null
          generation_completed_at?: string | null
          generation_error?: string | null
          generation_session_id?: string | null
          generation_started_at?: string | null
          generation_status?: string
          id?: string
          logo_url?: string | null
          mockup_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
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
