export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string
          size: string
          price: number
          discount_percent: number
          is_available: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description: string
          size: string
          price: number
          discount_percent?: number
          is_available?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string
          size?: string
          price?: number
          discount_percent?: number
          is_available?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          storage_path: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          storage_path: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          storage_path?: string
          display_order?: number
          created_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          type: 'percent' | 'fixed'
          value: number
          active: boolean
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          type: 'percent' | 'fixed'
          value: number
          active?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          type?: 'percent' | 'fixed'
          value?: number
          active?: boolean
          expires_at?: string | null
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_name: string
          customer_phone: string
          customer_email: string | null
          zipcode: string
          street: string
          number: string
          complement: string | null
          neighborhood: string
          city: string
          state: string
          subtotal: number
          discount_total: number
          coupon_discount: number
          shipping_fee: number
          total: number
          payment_status: string
          order_status: string
          coupon_code: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          customer_name: string
          customer_phone: string
          customer_email?: string | null
          zipcode: string
          street: string
          number: string
          complement?: string | null
          neighborhood: string
          city: string
          state: string
          subtotal: number
          discount_total: number
          coupon_discount: number
          shipping_fee: number
          total: number
          payment_status: string
          order_status: string
          coupon_code?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_name?: string
          customer_phone?: string
          customer_email?: string | null
          zipcode?: string
          street?: string
          number?: string
          complement?: string | null
          neighborhood?: string
          city?: string
          state?: string
          subtotal?: number
          discount_total?: number
          coupon_discount?: number
          shipping_fee?: number
          total?: number
          payment_status?: string
          order_status?: string
          coupon_code?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name_snapshot: string
          unit_price_snapshot: number
          discount_percent_snapshot: number
          quantity: number
          subtotal: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name_snapshot: string
          unit_price_snapshot: number
          discount_percent_snapshot: number
          quantity: number
          subtotal: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name_snapshot?: string
          unit_price_snapshot?: number
          discount_percent_snapshot?: number
          quantity?: number
          subtotal?: number
        }
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          status?: string
          created_at?: string
        }
      }
      site_settings: {
        Row: {
          id: string
          key: string
          value: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          updated_at?: string
        }
      }
      admin_profiles: {
        Row: {
          id: string
          auth_user_id: string
          name: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          name: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          name?: string
          role?: string
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      create_order: {
        Args: {
          p_order_number: string
          p_customer_name: string
          p_customer_phone: string
          p_customer_email: string | null
          p_zipcode: string
          p_street: string
          p_number: string
          p_complement: string | null
          p_neighborhood: string
          p_city: string
          p_state: string
          p_items: Json
          p_coupon_code: string | null
          p_shipping_fee: number
          p_notes: string | null
        }
        Returns: Json
      }
      get_product_public_url: {
        Args: { storage_path: string }
        Returns: string
      }
      get_order_by_number_and_phone: {
        Args: {
          p_order_number: string
          p_customer_phone: string
        }
        Returns: Json
      }
      mark_payment_informed: {
        Args: {
          p_order_number: string
          p_customer_phone: string
        }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
  }
}
