// types/app.ts
// Application-level TypeScript types shared across the codebase.
// These are NOT auto-generated — they are hand-crafted domain types.

// ─── Workspace ────────────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  user_id?: string;
  name: string;
  created_at: string;
}


// ─── Documents ────────────────────────────────────────────────────────────────

export type DocumentStatus = "processing" | "ingested" | "failed";
export type FileType = "pdf" | "txt" | "docx";

export interface Document {
  id: string;
  workspace_id: string;
  title: string;
  file_type: FileType;
  file_hash: string;
  status: DocumentStatus;
  chunk_count: number;
  created_at: string;
}

// ─── Chunks & Retrieval ───────────────────────────────────────────────────────

export interface ChunkMetadata {
  document_title: string;
  chunk_index: number;
  token_count?: number;
  page_number?: number;
}

export interface RankedChunk {
  id: string;
  document_id: string;
  workspace_id: string;
  content: string;
  metadata: ChunkMetadata;
  similarity: number;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant";

export interface Citation {
  document_title: string;
  chunk_index: number;
  similarity: number;
  excerpt: string; // First 150 chars of the chunk
}

export interface RetrievalDebug {
  workspace_id: string;
  chunks_retrieved: number;
  match_threshold: number;
  latency_ms: number;
  sql_filter: string;
}

export interface ChatMessage {
  id: string;
  workspace_id: string;
  role: MessageRole;
  content: string;
  citations: Citation[];
  retrieval_debug?: RetrievalDebug;
  created_at: string;
}

export interface ChatTurn {
  role: MessageRole;
  content: string;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
}

// ─── Tool Calls ───────────────────────────────────────────────────────────────

export type ToolCallStatus = "success" | "failure" | "validation_error";

export interface ToolCallLog {
  id: string;
  workspace_id: string;
  tool_name: string;
  arguments: Record<string, unknown>;
  result?: Record<string, unknown>;
  status: ToolCallStatus;
  error_msg?: string;
  created_at: string;
}

export interface ToolCallResult {
  tool: string;
  status: ToolCallStatus;
  result?: Record<string, unknown>;
  error?: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}

export interface ChatApiResponse {
  answer: string;
  citations: Citation[];
  toolCallsMade: ToolCallResult[];
  retrievalDebug: RetrievalDebug;
}

// ─── SSE Stream Event Types ───────────────────────────────────────────────────

export type StreamEventType = "token" | "tool_call" | "tool_result" | "done" | "error";

export interface StreamEvent {
  type: StreamEventType;
  content?: string;       // For 'token' events
  name?: string;          // For 'tool_call' events
  result?: unknown;       // For 'tool_result' events
  citations?: Citation[]; // For 'done' events
  toolCallsMade?: ToolCallResult[];    // For 'done' events
  retrievalDebug?: RetrievalDebug;     // For 'done' events
  message?: string;       // For 'error' events
}
