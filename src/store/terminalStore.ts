import { create } from "zustand";
import { TerminalSession } from "@/types";
import { invoke } from "@tauri-apps/api/core";
import { generateId } from "@/services/utils";

interface TerminalState {
  sessions: TerminalSession[];
  activeSessionId: string | null;

  // Actions
  createSession: (cwd?: string) => Promise<string>;
  closeSession: (sessionId: string) => Promise<void>;
  setActiveSession: (sessionId: string) => void;
  writeToSession: (sessionId: string, data: string) => Promise<void>;
  resizeSession: (sessionId: string, cols: number, rows: number) => Promise<void>;
  renameSession: (sessionId: string, title: string) => void;
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  sessions: [],
  activeSessionId: null,

  createSession: async (cwd?: string) => {
    try {
      const backendId = await invoke<string>("create_terminal", { cwd: cwd ?? null });
      const session: TerminalSession = {
        id: backendId,
        title: cwd ? cwd.split(/[/\\]/).pop() ?? "Terminal" : "Terminal",
        cwd,
        active: true,
      };

      set((state) => ({
        sessions: [...state.sessions.map((s) => ({ ...s, active: false })), session],
        activeSessionId: backendId,
      }));

      return backendId;
    } catch (error) {
      console.error("Failed to create terminal:", error);
      throw error;
    }
  },

  closeSession: async (sessionId: string) => {
    try {
      await invoke("close_terminal", { sessionId });
    } catch (error) {
      console.warn("Failed to close terminal:", error);
    }

    const { sessions, activeSessionId } = get();
    const newSessions = sessions.filter((s) => s.id !== sessionId);
    const newActiveId =
      activeSessionId === sessionId
        ? newSessions[newSessions.length - 1]?.id ?? null
        : activeSessionId;

    set({ sessions: newSessions, activeSessionId: newActiveId });
  },

  setActiveSession: (sessionId: string) => {
    set({ activeSessionId: sessionId });
  },

  writeToSession: async (sessionId: string, data: string) => {
    await invoke("write_terminal", { sessionId, data });
  },

  resizeSession: async (sessionId: string, cols: number, rows: number) => {
    await invoke("resize_terminal", { sessionId, cols, rows });
  },

  renameSession: (sessionId: string, title: string) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, title } : s
      ),
    }));
  },
}));
