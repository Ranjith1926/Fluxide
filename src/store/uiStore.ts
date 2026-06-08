import { create } from "zustand";
import { ActivityView, ThemeMode } from "@/types";

const THEME_KEY = "fluxide-theme";

function getInitialTheme(): ThemeMode {
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  }
  return "dark";
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

// Apply the persisted theme as early as possible.
applyTheme(getInitialTheme());

interface UIState {
  activeView: ActivityView;
  sidebarVisible: boolean;
  terminalVisible: boolean;
  aiPanelVisible: boolean;
  sidebarWidth: number;
  aiPanelWidth: number;
  terminalHeight: number;
  isMaximized: boolean;
  theme: ThemeMode;

  // Actions
  setActiveView: (view: ActivityView) => void;
  toggleSidebar: () => void;
  toggleTerminal: () => void;
  toggleAIPanel: () => void;
  setSidebarWidth: (width: number) => void;
  setAIPanelWidth: (width: number) => void;
  setTerminalHeight: (height: number) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeView: "explorer",
  sidebarVisible: true,
  terminalVisible: false,
  aiPanelVisible: true,
  sidebarWidth: 240,
  aiPanelWidth: 340,
  terminalHeight: 260,
  isMaximized: false,
  theme: getInitialTheme(),

  setActiveView: (view) => {
    set((state) => ({
      activeView: view,
      sidebarVisible: view === state.activeView ? !state.sidebarVisible : true,
    }));
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarVisible: !state.sidebarVisible }));
  },

  toggleTerminal: () => {
    set((state) => ({ terminalVisible: !state.terminalVisible }));
  },

  toggleAIPanel: () => {
    set((state) => ({ aiPanelVisible: !state.aiPanelVisible }));
  },

  setSidebarWidth: (width) => {
    set({ sidebarWidth: Math.max(180, Math.min(500, width)) });
  },

  setAIPanelWidth: (width) => {
    set({ aiPanelWidth: Math.max(280, Math.min(600, width)) });
  },

  setTerminalHeight: (height) => {
    set({ terminalHeight: Math.max(120, Math.min(600, height)) });
  },

  setTheme: (theme) => {
    applyTheme(theme);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_KEY, theme);
    }
    set({ theme });
  },

  toggleTheme: () => {
    get().setTheme(get().theme === "dark" ? "light" : "dark");
  },
}));
