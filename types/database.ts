// types/database.ts
// Supabase database type definitions matching DDL schema.

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
        Relationships: [];
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
          id?: string;
          workspace_id?: string;
          title?: string;
          file_type?: string;
          file_hash?: string;
          status?: string;
          chunk_count?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
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
          id?: string;
          workspace_id?: string;
          document_id?: string;
          content?: string;
          metadata?: Json;
          embedding?: number[] | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_chunks_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
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
          id?: string;
          workspace_id?: string;
          title?: string;
          description?: string | null;
          priority?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
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
        Update: {
          id?: string;
          workspace_id?: string;
          role?: string;
          content?: string;
          citations?: Json;
          retrieval_debug?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
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
        Update: {
          id?: string;
          workspace_id?: string;
          tool_name?: string;
          arguments?: Json;
          result?: Json | null;
          status?: string;
          error_msg?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tool_calls_log_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
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
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentChunkRow = Database["public"]["Tables"]["document_chunks"]["Row"];
export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type ChatMessageRow = Database["public"]["Tables"]["chat_messages"]["Row"];
export type ToolCallLogRow = Database["public"]["Tables"]["tool_calls_log"]["Row"];
export type Document = DocumentRow;
export type Workspace = WorkspaceRow;
