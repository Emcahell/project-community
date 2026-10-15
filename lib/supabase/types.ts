// Tipos escritos a mano. Lo ideal es regenerarlos desde la base con
// `pnpm db:types` (requiere Supabase CLI y `supabase link`) y tipar los
// clientes con `createServerClient<Database>(...)`.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          need_id: string
          rejection_reason: string | null
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          need_id: string
          rejection_reason?: string | null
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          need_id?: string
          rejection_reason?: string | null
          status?: string
          student_id?: string
        }
      }
      institutions: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          is_disabled: boolean | null
          name: string
          phone: string | null
          profile_id: string
          schedule: {
            days: string[]
            open_time: string
            close_time: string
          } | null
          verified: boolean
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          phone?: string | null
          profile_id: string
          schedule?: {
            days: string[]
            open_time: string
            close_time: string
          } | null
          verified?: boolean
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          phone?: string | null
          profile_id?: string
          schedule?: {
            days: string[]
            open_time: string
            close_time: string
          } | null
          verified?: boolean
          website?: string | null
        }
      }
      needs: {
        Row: {
          created_at: string | null
          department_id: string | null
          description: string
          id: string
          institution_id: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          institution_id: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          institution_id?: string
          status?: string
          title?: string
        }
      }
      departments: {
        Row: {
          created_at: string | null
          id: string
          institution_id: string
          name: string
        }
      }
      team_members: {
        Row: {
          created_at: string | null
          member_id: string
          owner_id: string
        }
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          need_id: string | null
          read: boolean
          recipient_id: string
          type: string
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          career: string | null
          created_at: string | null
          cv_url: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_disabled: boolean | null
          last_name: string | null
          onboarding_completed: boolean | null
          role: string
          semester: number | null
        }
        Insert: {
          avatar_url?: string | null
          career?: string | null
          created_at?: string | null
          cv_url?: string | null
          full_name?: string | null
          id: string
          role: string
          semester?: number | null
        }
        Update: {
          avatar_url?: string | null
          career?: string | null
          created_at?: string | null
          cv_url?: string | null
          full_name?: string | null
          id?: string
          role?: string
          semester?: number | null
        }
      }
    }
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Institution = Database["public"]["Tables"]["institutions"]["Row"]
export type Need = Database["public"]["Tables"]["needs"]["Row"]
export type Application = Database["public"]["Tables"]["applications"]["Row"]
export type Department = Database["public"]["Tables"]["departments"]["Row"]
export type Notification = Database["public"]["Tables"]["notifications"]["Row"]

export type NeedStatus = "open" | "approved"
export type ApplicationStatus = "pending" | "accepted" | "rejected"
export type UserRole = "student" | "institution" | "admin"
