/**
 * Tipos mínimos do schema Supabase para NTRSL AI.
 * Regenerar com `supabase gen types` quando o projeto de banco estiver provisionado.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      daily_logs: {
        Row: {
          id: string;
          user_id: string;
          log_date: string;
          exercises: Json;
          foods: Json;
          summary: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          log_date: string;
          exercises?: Json;
          foods?: Json;
          summary?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          log_date?: string;
          exercises?: Json;
          foods?: Json;
          summary?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_usage: {
        Row: {
          user_id: string;
          last_request_at: string;
        };
        Insert: {
          user_id: string;
          last_request_at: string;
        };
        Update: {
          user_id?: string;
          last_request_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      security_audit_events: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      push_tokens: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
