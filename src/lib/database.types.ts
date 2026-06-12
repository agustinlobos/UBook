/**
 * Tipos de la base de datos de umoov (Supabase).
 * Derivados del esquema real introspectado vía PostgREST.
 * Si se agregan migraciones, regenerar con `supabase gen types` o actualizar a mano.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TurnStatus = "active" | "full" | "completed" | "cancelled";
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type TurnVisibility = "public" | "private";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          university: string | null;
          commune: string | null;
          rating: number;
          rating_count: number;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          university?: string | null;
          commune?: string | null;
          rating?: number;
          rating_count?: number;
          avatar_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      university_turns: {
        Row: {
          id: string;
          driver_id: string;
          driver_name: string | null;
          driver_rating: number | null;
          origin: string;
          destination: string;
          university: string | null;
          departure_date: string | null;
          departure_time: string | null;
          seats_available: number;
          contribution_clp: number;
          status: TurnStatus;
          vehicle_plate: string | null;
          visibility: TurnVisibility;
          group_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          driver_name?: string | null;
          driver_rating?: number | null;
          origin: string;
          destination: string;
          university?: string | null;
          departure_date: string;
          departure_time: string;
          seats_available: number;
          contribution_clp: number;
          status?: TurnStatus;
          vehicle_plate?: string | null;
          visibility?: TurnVisibility;
          group_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["university_turns"]["Insert"]>;
        Relationships: [];
      };
      turn_applications: {
        Row: {
          id: string;
          turn_id: string;
          applicant_id: string;
          applicant_name: string | null;
          applicant_email: string | null;
          driver_id: string | null;
          status: ApplicationStatus;
          created_at: string;
          updated_at: string;
          decided_at: string | null;
        };
        Insert: {
          id?: string;
          turn_id: string;
          // applicant_id, applicant_name, applicant_email, driver_id y status
          // los rellena el trigger prepare_turn_application_insert.
          applicant_id?: string;
          applicant_name?: string | null;
          applicant_email?: string | null;
          driver_id?: string | null;
          status?: ApplicationStatus;
        };
        Update: Partial<Database["public"]["Tables"]["turn_applications"]["Insert"]>;
        Relationships: [];
      };
      turn_messages: {
        Row: {
          id: string;
          turn_id: string;
          sender_id: string;
          recipient_id: string | null;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          turn_id: string;
          sender_id: string;
          recipient_id?: string | null;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["turn_messages"]["Insert"]>;
        Relationships: [];
      };
      turn_history: {
        Row: {
          id: string;
          user_id: string;
          turn_id: string | null;
          driver_id: string | null;
          driver_name: string | null;
          origin: string;
          destination: string;
          university: string | null;
          ride_date: string;
          departure_time: string | null;
          contribution_clp: number | null;
          status: string;
          vehicle_plate: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          turn_id?: string | null;
          driver_id?: string | null;
          driver_name?: string | null;
          origin: string;
          destination: string;
          university?: string | null;
          ride_date: string;
          departure_time?: string | null;
          contribution_clp?: number | null;
          status?: string;
          vehicle_plate?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["turn_history"]["Insert"]>;
        Relationships: [];
      };
      turn_ratings: {
        Row: {
          id: string;
          history_id: string | null;
          rater_id: string;
          driver_id: string;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          history_id?: string | null;
          rater_id: string;
          driver_id: string;
          rating: number;
        };
        Update: Partial<Database["public"]["Tables"]["turn_ratings"]["Insert"]>;
        Relationships: [];
      };
      user_groups: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_groups"]["Insert"]>;
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: string;
        };
        Update: Partial<Database["public"]["Tables"]["group_members"]["Insert"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string | null;
          turn_id: string | null;
          history_id: string | null;
          reason: string;
          details: string | null;
          status: ReportStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id?: string | null;
          turn_id?: string | null;
          history_id?: string | null;
          reason: string;
          details?: string | null;
          status?: ReportStatus;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [];
      };
      waitlist_signups: {
        Row: {
          id: string;
          name: string | null;
          university: string | null;
          commune: string | null;
          email: string;
          email_domain: string | null;
          status: string;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          university?: string | null;
          commune?: string | null;
          email: string;
          email_domain?: string | null;
          status?: string;
          source?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["waitlist_signups"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      cancel_driver_turn: {
        Args: { turn_id: string };
        Returns: undefined;
      };
      create_user_group: {
        Args: { p_name: string; p_emails: string[] };
        Returns: unknown;
      };
      respond_turn_application: {
        Args: { application_id: string; response_status: string };
        Returns: unknown;
      };
      submit_turn_rating: {
        Args: { target_history_id: string; score: number };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Atajos de tipos por tabla
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UniversityTurn = Database["public"]["Tables"]["university_turns"]["Row"];
export type TurnApplication = Database["public"]["Tables"]["turn_applications"]["Row"];
export type TurnMessage = Database["public"]["Tables"]["turn_messages"]["Row"];
export type TurnHistory = Database["public"]["Tables"]["turn_history"]["Row"];
export type TurnRating = Database["public"]["Tables"]["turn_ratings"]["Row"];
export type UserGroup = Database["public"]["Tables"]["user_groups"]["Row"];
export type GroupMember = Database["public"]["Tables"]["group_members"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type WaitlistSignup = Database["public"]["Tables"]["waitlist_signups"]["Row"];
