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
      conteudos_produzidos: {
        Row: {
          conteudo: string
          created_at: string | null
          data_fim: string | null
          data_programada: string
          horario_programado: string
          id: string
          lido_por: string[] | null
          nome: string
          programa_id: string | null
          recorrente: boolean | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          conteudo: string
          created_at?: string | null
          data_fim?: string | null
          data_programada: string
          horario_programado: string
          id?: string
          lido_por?: string[] | null
          nome: string
          programa_id?: string | null
          recorrente?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          conteudo?: string
          created_at?: string | null
          data_fim?: string | null
          data_programada?: string
          horario_programado?: string
          id?: string
          lido_por?: string[] | null
          nome?: string
          programa_id?: string | null
          recorrente?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conteudos_produzidos_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas"
            referencedColumns: ["id"]
          },
        ]
      }
      programas: {
        Row: {
          apresentador: string
          created_at: string | null
          dias: string[] | null
          horario_fim: string
          horario_inicio: string
          id: string
          nome: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          apresentador: string
          created_at?: string | null
          dias?: string[] | null
          horario_fim: string
          horario_inicio: string
          id?: string
          nome: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          apresentador?: string
          created_at?: string | null
          dias?: string[] | null
          horario_fim?: string
          horario_inicio?: string
          id?: string
          nome?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      testemunhais: {
        Row: {
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          horario_agendado: string
          id: string
          leituras: number | null
          lido_por: string[] | null
          patrocinador: string
          programa_id: string | null
          recorrente: boolean | null
          status: string | null
          texto: string
          timestamp_leitura: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          horario_agendado: string
          id?: string
          leituras?: number | null
          lido_por?: string[] | null
          patrocinador: string
          programa_id?: string | null
          recorrente?: boolean | null
          status?: string | null
          texto: string
          timestamp_leitura?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          horario_agendado?: string
          id?: string
          leituras?: number | null
          lido_por?: string[] | null
          patrocinador?: string
          programa_id?: string | null
          recorrente?: boolean | null
          status?: string | null
          texto?: string
          timestamp_leitura?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testemunhais_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      count_content_by_program_status: {
        Row: {
          count: number | null
          end_date: string | null
          programa_id: string | null
          programa_nome: string | null
          start_date: string | null
          status: string | null
        }
        Relationships: []
      }
      count_content_by_status: {
        Row: {
          count: number | null
          end_date: string | null
          start_date: string | null
          status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_update_user_password: {
        Args: { user_id: string; new_password: string }
        Returns: Json
      }
      check_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      count_content_by_program_status: {
        Args: { start_date: string; end_date: string }
        Returns: {
          programa_id: string
          programa_nome: string
          status: string
          count: number
        }[]
      }
      count_content_by_status: {
        Args: { start_date: string; end_date: string }
        Returns: {
          status: string
          count: number
        }[]
      }
      get_users_with_emails: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          role: string
          created_at: string
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_content_within_date_range: {
        Args: {
          content_row: Database["public"]["Tables"]["conteudos_produzidos"]["Row"]
          check_date: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "locutor"
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
      app_role: ["admin", "locutor"],
    },
  },
} as const
