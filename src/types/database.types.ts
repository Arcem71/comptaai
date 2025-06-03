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
      file_history: {
        Row: {
          id: string
          created_at: string
          files: Json
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          files: Json
          status: string
        }
        Update: {
          id?: string
          created_at?: string
          files?: Json
          status?: string
        }
      }
    }
    Functions: {}
  }
}