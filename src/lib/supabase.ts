import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          company_id: string
          name: string
          phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          name: string
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          name?: string
          phone?: string | null
          created_at?: string
        }
      }
      moves: {
        Row: {
          id: string
          client_id: string
          company_id: string
          date: string
          origin: string
          destination: string
          status: 'quote_sent' | 'approved' | 'scheduled' | 'in_progress' | 'completed'
          crew_info: string | null
          estimated_duration: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          company_id: string
          date: string
          origin: string
          destination: string
          status?: 'quote_sent' | 'approved' | 'scheduled' | 'in_progress' | 'completed'
          crew_info?: string | null
          estimated_duration?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          company_id?: string
          date?: string
          origin?: string
          destination?: string
          status?: 'quote_sent' | 'approved' | 'scheduled' | 'in_progress' | 'completed'
          crew_info?: string | null
          estimated_duration?: string | null
          created_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          move_id: string
          line_items: any[]
          subtotal: number
          tax: number
          total: number
          approved: boolean
          client_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          move_id: string
          line_items?: any[]
          subtotal?: number
          tax?: number
          total?: number
          approved?: boolean
          client_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          move_id?: string
          line_items?: any[]
          subtotal?: number
          tax?: number
          total?: number
          approved?: boolean
          client_notes?: string | null
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          move_id: string
          filename: string
          file_url: string
          file_size: number | null
          content_type: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          move_id: string
          filename: string
          file_url: string
          file_size?: number | null
          content_type?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          move_id?: string
          filename?: string
          file_url?: string
          file_size?: number | null
          content_type?: string | null
          uploaded_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          client_id: string
          title: string
          message: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          title: string
          message: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          title?: string
          message?: string
          read?: boolean
          created_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          move_id: string
          stars: number
          comment: string | null
          submitted_at: string
        }
        Insert: {
          id?: string
          move_id: string
          stars: number
          comment?: string | null
          submitted_at?: string
        }
        Update: {
          id?: string
          move_id?: string
          stars?: number
          comment?: string | null
          submitted_at?: string
        }
      }
    }
  }
}