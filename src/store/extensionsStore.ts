import { create } from "zustand";

const STORAGE_KEY = "fluxide-extensions";

/** Default enabled state for every known extension id. */
export const EXTENSION_DEFAULTS: Record<string, boolean> = {
  // Editor features (these actually drive the Monaco editor)
  minimap: true,
  "word-wrap": false,
  "bracket-colorization": true,
  "smooth-cursor": true,
  // Built-in capabilities
  "ai-assistant": true,
  terminal: true,
  syntax: true,
};

function loadEnabled(): Record<string, boolean> {
  if (typeof localStorage !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...EXTENSION_DEFAULTS, ...JSON.parse(saved) };
    } catch {
      /* ignore corrupt state */
    }
  }
  return { ...EXTENSION_DEFAULTS };
}

function persist(enabled: Record<string, boolean>) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
  }
}

interface ExtensionsState {
  enabled: Record<string, boolean>;
  toggle: (id: string) => void;
  setEnabled: (id: string, value: boolean) => void;
  isEnabled: (id: string) => boolean;
}

export const useExtensionsStore = create<ExtensionsState>((set, get) => ({
  enabled: loadEnabled(),

  toggle: (id) =>
    set((state) => {
      const next = { ...state.enabled, [id]: !state.enabled[id] };
      persist(next);
      return { enabled: next };
    }),

  setEnabled: (id, value) =>
    set((state) => {
      const next = { ...state.enabled, [id]: value };
      persist(next);
      return { enabled: next };
    }),

  isEnabled: (id) => get().enabled[id] ?? EXTENSION_DEFAULTS[id] ?? false,
}));
