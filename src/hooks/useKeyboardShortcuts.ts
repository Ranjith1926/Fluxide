import { useEffect } from "react";
import { useEditorStore } from "@/store/editorStore";
import { useUIStore } from "@/store/uiStore";
import { useTerminalStore } from "@/store/terminalStore";

export function useKeyboardShortcuts() {
  const { saveFile, saveAllFiles, closeTab, activeTabId } = useEditorStore();
  const { toggleTerminal, toggleSidebar, toggleAIPanel } = useUIStore();
  const { createSession } = useTerminalStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Save: Ctrl+S
      if (ctrl && e.key === "s" && !e.shiftKey) {
        e.preventDefault();
        saveFile();
        return;
      }

      // Save All: Ctrl+Shift+S
      if (ctrl && e.shiftKey && e.key === "S") {
        e.preventDefault();
        saveAllFiles();
        return;
      }

      // Close Tab: Ctrl+W
      if (ctrl && e.key === "w") {
        e.preventDefault();
        if (activeTabId) closeTab(activeTabId);
        return;
      }

      // Toggle Terminal: Ctrl+`
      if (ctrl && e.key === "`") {
        e.preventDefault();
        toggleTerminal();
        return;
      }

      // Toggle Sidebar: Ctrl+B
      if (ctrl && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Toggle AI: Ctrl+Shift+A
      if (ctrl && e.shiftKey && e.key === "A") {
        e.preventDefault();
        toggleAIPanel();
        return;
      }

      // New Terminal: Ctrl+Shift+`
      if (ctrl && e.shiftKey && e.key === "~") {
        e.preventDefault();
        createSession().catch(console.error);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    saveFile,
    saveAllFiles,
    closeTab,
    activeTabId,
    toggleTerminal,
    toggleSidebar,
    toggleAIPanel,
    createSession,
  ]);
}
