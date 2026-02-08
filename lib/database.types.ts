// TypeScript types for Supabase database
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
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          gender: string | null
          subscription_tier: string
          taste_preferences: Json
          stats: Json
          notifications_enabled: boolean
          following: string[]
          friends: string[]
          friend_requests: string[]
          is_ghost_mode: boolean
          direct_messages: Json
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role: string
          gender?: string | null
          subscription_tier?: string
          taste_preferences?: Json
          stats?: Json
          notifications_enabled?: boolean
          following?: string[]
          friends?: string[]
          friend_requests?: string[]
          is_ghost_mode?: boolean
          direct_messages?: Json
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          gender?: string | null
          subscription_tier?: string
          taste_preferences?: Json
          stats?: Json
          notifications_enabled?: boolean
          following?: string[]
          friends?: string[]
          friend_requests?: string[]
          is_ghost_mode?: boolean
          direct_messages?: Json
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          owner_id: string
          driver_id: string | null
          driver_name: string | null
          name: string
          category: string
          status: string
          rating: number
          description: string | null
          image_url: string | null
          opening_hours: string | null
          weekly_hours: Json
          favorite_count: number
          current_visitors: number
          tags: string[]
          invite_code: string | null
          checked_in_users: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          driver_id?: string | null
          driver_name?: string | null
          name: string
          category: string
          status?: string
          rating?: number
          description?: string | null
          image_url?: string | null
          opening_hours?: string | null
          weekly_hours?: Json
          favorite_count?: number
          current_visitors?: number
          tags?: string[]
          invite_code?: string | null
          checked_in_users?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          driver_id?: string | null
          driver_name?: string | null
          name?: string
          category?: string
          status?: string
          rating?: number
          description?: string | null
          image_url?: string | null
          opening_hours?: string | null
          weekly_hours?: Json
          favorite_count?: number
          current_visitors?: number
          tags?: string[]
          invite_code?: string | null
          checked_in_users?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          business_id: string
          latitude: number
          longitude: number
          accuracy: number | null
          heading: number | null
          speed: number | null
          timestamp: string
        }
        Insert: {
          id?: string
          business_id: string
          latitude: number
          longitude: number
          accuracy?: number | null
          heading?: number | null
          speed?: number | null
          timestamp?: string
        }
        Update: {
          id?: string
          business_id?: string
          latitude?: number
          longitude?: number
          accuracy?: number | null
          heading?: number | null
          speed?: number | null
          timestamp?: string
        }
      }
      routes: {
        Row: {
          id: string
          business_id: string
          location_name: string
          latitude: number
          longitude: number
          scheduled_start: string
          scheduled_end: string
          is_current: boolean
          rsvps: number
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          location_name: string
          latitude: number
          longitude: number
          scheduled_start: string
          scheduled_end: string
          is_current?: boolean
          rsvps?: number
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          location_name?: string
          latitude?: number
          longitude?: number
          scheduled_start?: string
          scheduled_end?: string
          is_current?: boolean
          rsvps?: number
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          business_id: string
          name: string
          price: number
          image_url: string | null
          description: string | null
          is_available: boolean
          category: string | null
          dietary_tags: string[]
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          price: number
          image_url?: string | null
          description?: string | null
          is_available?: boolean
          category?: string | null
          dietary_tags?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          price?: number
          image_url?: string | null
          description?: string | null
          is_available?: boolean
          category?: string | null
          dietary_tags?: string[]
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          business_id: string
          user_id: string
          user_name: string
          rating: number
          comment: string | null
          owner_response: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          user_name: string
          rating: number
          comment?: string | null
          owner_response?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          user_name?: string
          rating?: number
          comment?: string | null
          owner_response?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          business_id: string
          user_id: string
          user_name: string
          text: string
          is_plus: boolean
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          user_name: string
          text: string
          is_plus?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          user_name?: string
          text?: string
          is_plus?: boolean
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          business_id: string
          content: string
          is_important: boolean
          type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          content: string
          is_important?: boolean
          type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          content?: string
          is_important?: boolean
          type?: string | null
          created_at?: string
        }
      }
      predictions: {
        Row: {
          id: string
          business_id: string
          latitude: number
          longitude: number
          predicted_time: string
          confidence_score: number
          day_of_week: number
          hour_of_day: number
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          latitude: number
          longitude: number
          predicted_time: string
          confidence_score: number
          day_of_week: number
          hour_of_day: number
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          latitude?: number
          longitude?: number
          predicted_time?: string
          confidence_score?: number
          day_of_week?: number
          hour_of_day?: number
          created_at?: string
        }
      }
    }
    Functions: {
      get_nearby_businesses: {
        Args: {
          lat: number
          lng: number
          radius_meters?: number
        }
        Returns: Database['public']['Tables']['businesses']['Row'][]
      }
      get_business_current_location: {
        Args: {
          business_uuid: string
        }
        Returns: {
          latitude: number
          longitude: number
          timestamp: string
        }[]
      }
    }
  }
}
