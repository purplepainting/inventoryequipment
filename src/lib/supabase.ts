import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'employee'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'employee'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'employee'
          created_at?: string
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          name: string
          sku: string
          description: string | null
          current_stock: number
          minimum_stock: number
          unit_cost: number
          unit: string
          supplier: string | null
          category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sku: string
          description?: string | null
          current_stock?: number
          minimum_stock?: number
          unit_cost: number
          unit: string
          supplier?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sku?: string
          description?: string | null
          current_stock?: number
          minimum_stock?: number
          unit_cost?: number
          unit?: string
          supplier?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tools: {
        Row: {
          id: string
          name: string
          sku: string | null
          description: string | null
          location: string
          type: string | null
          status: 'available' | 'in_use' | 'maintenance'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sku?: string | null
          description?: string | null
          location?: string
          type?: string | null
          status?: 'available' | 'in_use' | 'maintenance'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sku?: string | null
          description?: string | null
          location?: string
          type?: string | null
          status?: 'available' | 'in_use' | 'maintenance'
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          status: 'active' | 'completed' | 'archived'
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: 'active' | 'completed' | 'archived'
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: 'active' | 'completed' | 'archived'
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory_transactions: {
        Row: {
          id: string
          inventory_item_id: string
          project_id: string | null
          quantity: number
          unit_cost: number
          total_cost: number
          transaction_type: 'checkout' | 'restock'
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          inventory_item_id: string
          project_id?: string | null
          quantity: number
          unit_cost: number
          total_cost: number
          transaction_type: 'checkout' | 'restock'
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          inventory_item_id?: string
          project_id?: string | null
          quantity?: number
          unit_cost?: number
          total_cost?: number
          transaction_type?: 'checkout' | 'restock'
          notes?: string | null
          created_by?: string
          created_at?: string
        }
      }
      tool_movements: {
        Row: {
          id: string
          tool_id: string
          project_id: string | null
          from_location: string
          to_location: string
          movement_type: 'checkout' | 'return' | 'transfer'
          notes: string | null
          moved_by: string
          moved_at: string
        }
        Insert: {
          id?: string
          tool_id: string
          project_id?: string | null
          from_location: string
          to_location: string
          movement_type: 'checkout' | 'return' | 'transfer'
          notes?: string | null
          moved_by: string
          moved_at?: string
        }
        Update: {
          id?: string
          tool_id?: string
          project_id?: string | null
          from_location?: string
          to_location?: string
          movement_type?: 'checkout' | 'return' | 'transfer'
          notes?: string | null
          moved_by?: string
          moved_at?: string
        }
      }
    }
  }
}
