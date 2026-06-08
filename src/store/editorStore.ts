import { create } from "zustand";
import { EditorTab, EditorPosition, EditorSelection } from "@/types";
import { readFile, writeFile } from "@/services/filesystem";
import { detectLanguage, generateId } from "@/services/utils";

interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;
  position: EditorPosition;
  selection: EditorSelection | null;

  // Actions
  openFile: (path: string, name: string) => Promise<void>;
  openNewFile: () => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateContent: (tabId: string, content: string) => void;
  saveFile: (tabId?: string) => Promise<void>;
  saveAllFiles: () => Promise<void>;
  setPosition: (position: EditorPosition) => void;
  setSelection: (selection: EditorSelection | null) => void;
  getActiveTab: () => EditorTab | null;
  isTabOpen: (path: string) => boolean;
  markDirty: (tabId: string, dirty: boolean) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  position: { line: 1, column: 1 },
  selection: null,

  openFile: async (path: string, name: string) => {
    const { tabs } = get();

    // If already open, just activate it
    const existing = tabs.find((t) => t.path === path);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }

    try {
      const content = await readFile(path);
      const ext = name.split(".").pop() || "";
      const language = detectLanguage(ext);

      const newTab: EditorTab = {
        id: generateId(),
        path,
        name,
        language,
        content,
        isDirty: false,
      };

      set((state) => ({
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      }));
    } catch (error) {
      console.error("Failed to open file:", error);
      throw error;
    }
  },

  openNewFile: () => {
    const newTab: EditorTab = {
      id: generateId(),
      path: "",
      name: "untitled",
      language: "plaintext",
      content: "",
      isDirty: false,
      isNew: true,
    };
    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));
  },

  closeTab: (tabId: string) => {
    const { tabs, activeTabId } = get();
    const tabIndex = tabs.findIndex((t) => t.id === tabId);
    const newTabs = tabs.filter((t) => t.id !== tabId);

    let newActiveId: string | null = activeTabId;
    if (activeTabId === tabId) {
      if (newTabs.length === 0) {
        newActiveId = null;
      } else if (tabIndex >= newTabs.length) {
        newActiveId = newTabs[newTabs.length - 1].id;
      } else {
        newActiveId = newTabs[tabIndex]?.id ?? newTabs[tabIndex - 1]?.id ?? null;
      }
    }

    set({ tabs: newTabs, activeTabId: newActiveId });
  },

  setActiveTab: (tabId: string) => {
    set({ activeTabId: tabId });
  },

  updateContent: (tabId: string, content: string) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, content, isDirty: true } : t
      ),
    }));
  },

  saveFile: async (tabId?: string) => {
    const { tabs, activeTabId } = get();
    const id = tabId ?? activeTabId;
    if (!id) return;

    const tab = tabs.find((t) => t.id === id);
    if (!tab || !tab.path || tab.isNew) return;

    try {
      await writeFile(tab.path, tab.content);
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.id === id ? { ...t, isDirty: false } : t
        ),
      }));
    } catch (error) {
      console.error("Failed to save file:", error);
      throw error;
    }
  },

  saveAllFiles: async () => {
    const { tabs, saveFile } = get();
    await Promise.all(
      tabs.filter((t) => t.isDirty && t.path).map((t) => saveFile(t.id))
    );
  },

  setPosition: (position: EditorPosition) => {
    set({ position });
  },

  setSelection: (selection: EditorSelection | null) => {
    set({ selection });
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find((t) => t.id === activeTabId) ?? null;
  },

  isTabOpen: (path: string) => {
    return get().tabs.some((t) => t.path === path);
  },

  markDirty: (tabId: string, dirty: boolean) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, isDirty: dirty } : t
      ),
    }));
  },
}));
