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
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          need_id: string
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          need_id?: string
          status?: string
          student_id?: string
        }
      }
      institutions: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          phone: string | null
          profile_id: string
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
          verified?: boolean
          website?: string | null
        }
      }
      needs: {
        Row: {
          created_at: string | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          career: string | null
          created_at: string | null
          cv_url: string | null
          full_name: string | null
          id: string
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

export type NeedStatus = "open" | "in_progress" | "completed"
export type ApplicationStatus = "pending" | "accepted" | "rejected"
export type UserRole = "student" | "institution" | "admin"
