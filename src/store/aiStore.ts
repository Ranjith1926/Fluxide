import { create } from "zustand";
import { ChatMessage, ModelInfo, ModelStatus, StreamEvent, CompletionRequest } from "@/types";
import { invoke } from "@tauri-apps/api/core";
import { Channel } from "@tauri-apps/api/core";
import { generateId } from "@/services/utils";
import { SYSTEM_CODING_ASSISTANT } from "@/services/prompts";

interface AIState {
  messages: ChatMessage[];
  models: ModelInfo[];
  downloadedModels: string[];
  status: ModelStatus;
  isStreaming: boolean;
  error: string | null;
  downloadProgress: Record<string, number>;
  activeSystemPrompt: string;

  // Actions
  sendMessage: (content: string, contextFiles?: string[]) => Promise<void>;
  cancelGeneration: () => Promise<void>;
  clearHistory: () => void;
  loadModelStatus: () => Promise<void>;
  loadModels: () => Promise<void>;
  loadDownloadedModels: () => Promise<void>;
  startEngine: () => Promise<void>;
  stopEngine: () => Promise<void>;
  downloadModel: (modelId: string) => Promise<void>;
  setActiveModel: (modelId: string) => Promise<void>;
  setSystemPrompt: (prompt: string) => void;
  removeMessage: (id: string) => void;
  retryLastMessage: () => Promise<void>;
}

export const useAIStore = create<AIState>((set, get) => ({
  messages: [],
  models: [],
  downloadedModels: [],
  status: {
    loaded: false,
    loading: false,
    active_model: null,
    engine_running: false,
    error: null,
    server_url: null,
  },
  isStreaming: false,
  error: null,
  downloadProgress: {},
  activeSystemPrompt: SYSTEM_CODING_ASSISTANT,

  sendMessage: async (content: string, contextFiles?: string[]) => {
    const { messages, status, activeSystemPrompt } = get();

    if (!status.engine_running) {
      set({ error: "AI engine is not running. Please start it or download a model." });
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content,
      timestamp: Date.now(),
      contextFiles,
    };

    // Add placeholder assistant message
    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
    };

    set((state) => ({
      messages: [...state.messages, userMessage, assistantMessage],
      isStreaming: true,
      error: null,
    }));

    const channel = new Channel<StreamEvent>();
    channel.onmessage = (event: StreamEvent) => {
      if (event.type === "token" && event.content) {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: m.content + event.content }
              : m
          ),
        }));
      } else if (event.done || event.type === "done") {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMessage.id ? { ...m, isStreaming: false } : m
          ),
          isStreaming: false,
        }));
      } else if (event.type === "error") {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: `Error: ${event.error}`, isStreaming: false }
              : m
          ),
          isStreaming: false,
          error: event.error ?? "Unknown error",
        }));
      } else if (event.type === "cancelled") {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMessage.id ? { ...m, isStreaming: false } : m
          ),
          isStreaming: false,
        }));
      }
    };

    const request: CompletionRequest = {
      prompt: content,
      system_prompt: activeSystemPrompt,
      max_tokens: 2048,
      temperature: 0.7,
      context_files: contextFiles,
    };

    try {
      await invoke("stream_completion", { request, onEvent: channel });
    } catch (error) {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: `Failed to get response: ${error}`, isStreaming: false }
            : m
        ),
        isStreaming: false,
        error: String(error),
      }));
    }
  },

  cancelGeneration: async () => {
    await invoke("cancel_generation");
    set((state) => ({
      messages: state.messages.map((m) =>
        m.isStreaming ? { ...m, isStreaming: false } : m
      ),
      isStreaming: false,
    }));
  },

  clearHistory: () => {
    set({ messages: [], error: null });
  },

  loadModelStatus: async () => {
    try {
      const status = await invoke<ModelStatus>("get_model_status");
      set({ status });
    } catch (error) {
      console.error("Failed to load model status:", error);
    }
  },

  loadModels: async () => {
    try {
      const models = await invoke<ModelInfo[]>("list_models");
      set({ models });
    } catch (error) {
      console.error("Failed to load models:", error);
    }
  },

  loadDownloadedModels: async () => {
    try {
      const downloadedModels = await invoke<string[]>("list_downloaded_models");
      set({ downloadedModels });
    } catch (error) {
      console.error("Failed to load downloaded models:", error);
    }
  },

  startEngine: async () => {
    set((state) => ({
      status: { ...state.status, loading: true, error: null },
    }));
    try {
      await invoke("start_ai_engine");
      await get().loadModelStatus();
    } catch (error) {
      set((state) => ({
        status: { ...state.status, loading: false, error: String(error) },
        error: String(error),
      }));
    }
  },

  stopEngine: async () => {
    try {
      await invoke("stop_ai_engine");
      set((state) => ({
        status: { ...state.status, engine_running: false, loaded: false },
      }));
    } catch (error) {
      console.error("Failed to stop engine:", error);
    }
  },

  downloadModel: async (modelId: string) => {
    try {
      set((state) => ({
        downloadProgress: { ...state.downloadProgress, [modelId]: 0 },
      }));
      await invoke("download_model", { modelId });
      await get().loadDownloadedModels();
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  setActiveModel: async (modelId: string) => {
    try {
      await invoke("set_active_model", { modelId });
      await get().loadModelStatus();
    } catch (error) {
      set({ error: String(error) });
      await get().loadModelStatus();
      throw error;
    }
  },

  setSystemPrompt: (prompt: string) => {
    set({ activeSystemPrompt: prompt });
  },

  removeMessage: (id: string) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    }));
  },

  retryLastMessage: async () => {
    const { messages, sendMessage } = get();
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMessage) return;

    // Remove last assistant message if it exists
    let lastAssistantIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") { lastAssistantIdx = i; break; }
    }
    if (lastAssistantIdx >= 0) {
      set((state) => ({
        messages: state.messages.filter((_, i) => i !== lastAssistantIdx),
      }));
    }

    await sendMessage(lastUserMessage.content, lastUserMessage.contextFiles);
  },
}));
