// types/database.ts
// Supabase database type definitions.
// In a full project these would be auto-generated via:
//   npx supabase gen types typescript --project-id <ref> > types/database.ts
// For now, these are hand-crafted to match our DDL exactly.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          file_type: string;
          file_hash: string;
          status: string;
          chunk_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          file_type: string;
          file_hash: string;
          status?: string;
          chunk_count?: number;
          created_at?: string;
        };
        Update: {
          status?: string;
          chunk_count?: number;
        };
      };
      document_chunks: {
        Row: {
          id: string;
          workspace_id: string;
          document_id: string;
          content: string;
          metadata: Json;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          document_id: string;
          content: string;
          metadata?: Json;
          embedding?: number[] | null;
          created_at?: string;
        };
        Update: {
          embedding?: number[] | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          description: string | null;
          priority: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          description?: string | null;
          priority?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          priority?: string;
          status?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          workspace_id: string;
          role: string;
          content: string;
          citations: Json;
          retrieval_debug: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          role: string;
          content: string;
          citations?: Json;
          retrieval_debug?: Json;
          created_at?: string;
        };
        Update: never;
      };
      tool_calls_log: {
        Row: {
          id: string;
          workspace_id: string;
          tool_name: string;
          arguments: Json;
          result: Json | null;
          status: string;
          error_msg: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          tool_name: string;
          arguments: Json;
          result?: Json | null;
          status: string;
          error_msg?: string | null;
          created_at?: string;
        };
        Update: never;
      };
    };
    Functions: {
      match_workspace_chunks: {
        Args: {
          query_embedding: number[];
          filter_workspace_id: string;
          match_threshold?: number;
          match_count?: number;
        };
        Returns: {
          id: string;
          document_id: string;
          workspace_id: string;
          content: string;
          metadata: Json;
          similarity: number;
        }[];
      };
    };
  };
}
