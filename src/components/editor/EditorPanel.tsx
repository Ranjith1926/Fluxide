import { Code2, FolderOpen } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { useFileStore } from "@/store/fileStore";
import { MonacoEditor } from "./MonacoEditor";
import { TabBar } from "./TabBar";

export function EditorPanel() {
  const { tabs, activeTabId, getActiveTab } = useEditorStore();
  const { openFolder } = useFileStore();

  const activeTab = getActiveTab();

  if (tabs.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <WelcomeScreen onOpenFolder={openFolder} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TabBar />
      {activeTab ? (
        <MonacoEditor key={activeTab.id} tab={activeTab} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-flux-muted text-sm">
          Select a file to edit
        </div>
      )}
    </div>
  );
}

function WelcomeScreen({ onOpenFolder }: { onOpenFolder: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 select-none">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-flux-accent/20 border border-flux-accent/30 flex items-center justify-center shadow-glow">
          <Code2 size={32} className="text-flux-accent" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-flux-text">FluxIDE</h1>
          <p className="text-sm text-flux-muted mt-1">Offline AI Coding. Supercharged.</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 w-72">
        <button
          onClick={onOpenFolder}
          className="w-full flex items-center gap-3 px-4 py-3 bg-flux-surface hover:bg-flux-panel border border-flux-border hover:border-flux-accent/50 rounded-lg transition-all group"
        >
          <FolderOpen size={18} className="text-flux-accent" />
          <div className="text-left">
            <div className="text-sm font-medium text-flux-text">Open Folder</div>
            <div className="text-xs text-flux-muted">Open a project workspace</div>
          </div>
          <span className="ml-auto text-xs text-flux-muted font-mono">Ctrl+K Ctrl+O</span>
        </button>
      </div>

      {/* Shortcuts */}
      <div className="grid grid-cols-2 gap-3 text-xs text-flux-muted max-w-sm">
        {[
          ["Ctrl+S", "Save file"],
          ["Ctrl+`", "Toggle terminal"],
          ["Ctrl+B", "Toggle sidebar"],
          ["Ctrl+Shift+A", "Toggle AI"],
          ["Ctrl+Shift+E", "Explain code"],
          ["Ctrl+Shift+F", "Fix code"],
        ].map(([key, desc]) => (
          <div key={key} className="flex items-center justify-between gap-2 px-2 py-1">
            <span className="font-mono text-2xs bg-flux-surface border border-flux-border rounded px-1.5 py-0.5 text-flux-text">
              {key}
            </span>
            <span>{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
