export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string | null
          email: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          email: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          email?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      models: {
        Row: {
          id: string
          user_id: string
          prompt: string
          file_url: string | null
          preview_url: string | null
          status: string
          parameters: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt: string
          file_url?: string | null
          preview_url?: string | null
          status?: string
          parameters?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt?: string
          file_url?: string | null
          preview_url?: string | null
          status?: string
          parameters?: Json
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          model_id: string
          material: string
          quantity: number
          price: number
          status: string
          shipping_address: Json
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          model_id: string
          material?: string
          quantity?: number
          price: number
          status?: string
          shipping_address: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          model_id?: string
          material?: string
          quantity?: number
          price?: number
          status?: string
          shipping_address?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      error_logs: {
        Row: {
          id: string
          source: string
          payload: Json | null
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          source: string
          payload?: Json | null
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          source?: string
          payload?: Json | null
          message?: string
          created_at?: string
        }
      }
    }
  }
}
