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
      action_history: {
        Row: {
          action_type: string
          created_at: string
          id: string
          item_details: Json | null
          item_name: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          item_details?: Json | null
          item_name: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          item_details?: Json | null
          item_name?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          expires_at: string | null
          generated_at: string | null
          id: string
          recommendation_type: string
          recommendations: Json
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          recommendation_type: string
          recommendations: Json
          user_id: string
        }
        Update: {
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          recommendation_type?: string
          recommendations?: Json
          user_id?: string
        }
        Relationships: []
      }
      consumption_patterns: {
        Row: {
          average_consumption_rate: number | null
          created_at: string | null
          id: string
          item_name: string
          last_purchase_date: string | null
          times_purchased: number | null
          typical_quantity: number | null
          typical_unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_consumption_rate?: number | null
          created_at?: string | null
          id?: string
          item_name: string
          last_purchase_date?: string | null
          times_purchased?: number | null
          typical_quantity?: number | null
          typical_unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_consumption_rate?: number | null
          created_at?: string | null
          id?: string
          item_name?: string
          last_purchase_date?: string | null
          times_purchased?: number | null
          typical_quantity?: number | null
          typical_unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      food_items: {
        Row: {
          amount: number
          created_at: string | null
          date_cooked_stored: string
          eat_by_date: string
          freshness_days: number | null
          id: string
          label: string
          name: string
          notes: string | null
          storage_location: string
          unit: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          date_cooked_stored: string
          eat_by_date: string
          freshness_days?: number | null
          id?: string
          label?: string
          name: string
          notes?: string | null
          storage_location: string
          unit?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date_cooked_stored?: string
          eat_by_date?: string
          freshness_days?: number | null
          id?: string
          label?: string
          name?: string
          notes?: string | null
          storage_location?: string
          unit?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meal_combinations: {
        Row: {
          created_at: string | null
          frequency: number | null
          id: string
          ingredients: Json
          last_prepared: string | null
          meal_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          frequency?: number | null
          id?: string
          ingredients: Json
          last_prepared?: string | null
          meal_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          frequency?: number | null
          id?: string
          ingredients?: Json
          last_prepared?: string | null
          meal_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          created_at: string | null
          destination_time: string | null
          id: string
          name: string
          notes: string | null
          planned_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          destination_time?: string | null
          id?: string
          name: string
          notes?: string | null
          planned_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          destination_time?: string | null
          id?: string
          name?: string
          notes?: string | null
          planned_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      user_api_tokens: {
        Row: {
          created_at: string
          encrypted_token: string
          id: string
          token_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_token: string
          id?: string
          token_name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_token?: string
          id?: string
          token_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          dietary_restrictions: string[] | null
          favorite_items: Json | null
          id: string
          preferred_meal_types: string[] | null
          shopping_frequency: string | null
          typical_household_size: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dietary_restrictions?: string[] | null
          favorite_items?: Json | null
          id?: string
          preferred_meal_types?: string[] | null
          shopping_frequency?: string | null
          typical_household_size?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dietary_restrictions?: string[] | null
          favorite_items?: Json | null
          id?: string
          preferred_meal_types?: string[] | null
          shopping_frequency?: string | null
          typical_household_size?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrypt_api_token: {
        Args: { encrypted_token: string }
        Returns: string
      }
      encrypt_api_token: {
        Args: { token: string }
        Returns: string
      }
      encrypt_api_token_test: {
        Args: { token: string }
        Returns: string
      }
      get_decrypted_api_token: {
        Args: { p_token_name: string }
        Returns: string
      }
      store_api_token: {
        Args: { p_token_name: string; p_api_token: string }
        Returns: string
      }
      update_consumption_pattern: {
        Args: {
          p_user_id: string
          p_item_name: string
          p_quantity: number
          p_unit: string
        }
        Returns: undefined
      }
    }
    Enums: {
      food_item_label: "raw material" | "cooked meal"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      food_item_label: ["raw material", "cooked meal"],
    },
  },
} as const
