// ─── File System ──────────────────────────────────────────────────────────────

export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
  size?: number;
  extension?: string;
}

// ─── Editor ───────────────────────────────────────────────────────────────────

export interface EditorTab {
  id: string;
  path: string;
  name: string;
  language: string;
  content: string;
  isDirty: boolean;
  isNew?: boolean;
}

export interface EditorPosition {
  line: number;
  column: number;
}

export interface EditorSelection {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  text: string;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  contextFiles?: string[];
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  filename: string;
  size_gb: number;
  download_url: string;
  parameters: string;
  context_length: number;
  recommended: boolean;
}

export interface ModelStatus {
  loaded: boolean;
  loading: boolean;
  active_model: string | null;
  engine_running: boolean;
  error: string | null;
  server_url: string | null;
}

export interface StreamEvent {
  type: "start" | "token" | "done" | "error" | "cancelled";
  content?: string;
  error?: string;
  done: boolean;
}

export interface CompletionRequest {
  prompt: string;
  system_prompt?: string;
  max_tokens?: number;
  temperature?: number;
  context_files?: string[];
}

// ─── Terminal ─────────────────────────────────────────────────────────────────

export interface TerminalSession {
  id: string;
  title: string;
  cwd?: string;
  active: boolean;
}

// ─── Workspace ────────────────────────────────────────────────────────────────

export interface WorkspaceInfo {
  root: string;
  file_count: number;
  indexed: boolean;
}

export interface SearchResult {
  path: string;
  line: number;
  content: string;
  matches: [number, number][];
}

// ─── UI ───────────────────────────────────────────────────────────────────────

export type ActivityView = "explorer" | "search" | "extensions" | "ai" | "settings";

export type ThemeMode = "dark" | "light";

export interface NotificationItem {
  id: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
  timestamp: number;
}

// ─── Model Download ───────────────────────────────────────────────────────────

export interface DownloadProgress {
  model_id: string;
  progress: number;
  downloaded: number;
  total: number;
}
