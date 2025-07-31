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
          user_id: string | null
          company_id: string | null
          name: string
          phone: string | null
          created_at: string
          is_admin: boolean | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          company_id?: string | null
          name: string
          phone?: string | null
          created_at?: string
          is_admin?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string | null
          company_id?: string | null
          name?: string
          phone?: string | null
          created_at?: string
          is_admin?: boolean | null
        }
      }
      admins: {
        Row: {
          id: string
          user_id: string
          company_id: string
          name: string | null
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          name?: string | null
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          name?: string | null
          email?: string | null
          created_at?: string
        }
      }
      crew: {
        Row: {
          id: string
          user_id: string
          company_id: string
          name: string | null
          email: string | null
          phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          name?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string
        }
      }
      invites: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'client' | 'crew'
          company_id: string
          token: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'admin' | 'client' | 'crew'
          company_id: string
          token?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'client' | 'crew'
          company_id?: string
          token?: string | null
          expires_at?: string | null
          created_at?: string
        }
      }
      moves: {
        Row: {
          id: string
          client_id: string | null
          company_id: string | null
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
          client_id?: string | null
          company_id?: string | null
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
          client_id?: string | null
          company_id?: string | null
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
          move_id: string | null
          line_items: any[]
          subtotal: number
          tax: number
          total: number
          approved: boolean | null
          client_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          move_id?: string | null
          line_items?: any[]
          subtotal?: number
          tax?: number
          total?: number
          approved?: boolean | null
          client_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          move_id?: string | null
          line_items?: any[]
          subtotal?: number
          tax?: number
          total?: number
          approved?: boolean | null
          client_notes?: string | null
          created_at?: string
        }
      }
      services: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          price: number | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          price?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          price?: number | null
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          move_id: string
          company_id: string
          invoice_number: string | null
          issue_date: string
          due_date: string | null
          total_amount: number
          status: 'pending' | 'paid' | 'canceled'
          payment_details: string | null
          created_at: string
        }
        Insert: {
          id?: string
          move_id: string
          company_id: string
          invoice_number?: string | null
          issue_date: string
          due_date?: string | null
          total_amount: number
          status?: 'pending' | 'paid' | 'canceled'
          payment_details?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          move_id?: string
          company_id?: string
          invoice_number?: string | null
          issue_date?: string
          due_date?: string | null
          total_amount?: number
          status?: 'pending' | 'paid' | 'canceled'
          payment_details?: string | null
          created_at?: string
        }
      }
      move_updates: {
        Row: {
          id: string
          move_id: string
          timestamp: string | null
          title: string
          description: string | null
          status_change_to: 'quote_sent' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | null
          created_at: string
        }
        Insert: {
          id?: string
          move_id: string
          timestamp?: string | null
          title: string
          description?: string | null
          status_change_to?: 'quote_sent' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | null
          created_at?: string
        }
        Update: {
          id?: string
          move_id?: string
          timestamp?: string | null
          title?: string
          description?: string | null
          status_change_to?: 'quote_sent' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | null
          created_at?: string
        }
      }
      client_activity_log: {
        Row: {
          id: string
          client_id: string
          activity_type: string
          description: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          activity_type: string
          description?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          activity_type?: string
          description?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          company_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid'
          current_period_start: string | null
          current_period_end: string | null
          trial_end: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid'
          current_period_start?: string | null
          current_period_end?: string | null
          trial_end?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid'
          current_period_start?: string | null
          current_period_end?: string | null
          trial_end?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      documents: {
        Row: {
          id: string
          move_id: string | null
          filename: string
          file_url: string
          file_size: number | null
          content_type: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          move_id?: string | null
          filename: string
          file_url: string
          file_size?: number | null
          content_type?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          move_id?: string | null
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
          client_id: string | null
          title: string
          message: string
          read: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          title: string
          message: string
          read?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          title?: string
          message?: string
          read?: boolean | null
          created_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          move_id: string | null
          stars: number
          comment: string | null
          submitted_at: string
        }
        Insert: {
          id?: string
          move_id?: string | null
          stars: number
          comment?: string | null
          submitted_at?: string
        }
        Update: {
          id?: string
          move_id?: string | null
          stars?: number
          comment?: string | null
          submitted_at?: string
        }
      }
    }
  }
}