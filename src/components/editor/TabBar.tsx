import { X, Circle } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { EditorTab } from "@/types";
import { cn } from "@/services/utils";
import { FileIconView } from "@/services/fileIcons";

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useEditorStore();

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-end h-9 bg-flux-bg border-b border-flux-border overflow-x-auto shrink-0 scrollbar-none">
      {tabs.map((tab) => (
        <Tab
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onActivate={() => setActiveTab(tab.id)}
          onClose={(e) => {
            e.stopPropagation();
            closeTab(tab.id);
          }}
        />
      ))}
    </div>
  );
}

interface TabProps {
  tab: EditorTab;
  isActive: boolean;
  onActivate: () => void;
  onClose: (e: React.MouseEvent) => void;
}

function Tab({ tab, isActive, onActivate, onClose }: TabProps) {
  return (
    <div
      onClick={onActivate}
      className={cn(
        "group flex items-center gap-1.5 px-3 h-8 text-xs cursor-pointer border-r border-flux-border shrink-0 select-none transition-colors duration-100 relative",
        isActive
          ? "bg-flux-panel text-flux-text border-t border-flux-accent"
          : "bg-flux-bg text-flux-muted hover:text-flux-text hover:bg-flux-surface"
      )}
    >
      <span className="flex items-center shrink-0">
        <FileIconView name={tab.name} size={14} />
      </span>
      <span className={cn("max-w-[120px] truncate", isActive ? "text-flux-text" : "text-flux-muted")}>
        {tab.name}
      </span>
      <button
        onClick={onClose}
        className={cn(
          "flex items-center justify-center w-4 h-4 rounded transition-colors",
          "opacity-0 group-hover:opacity-100",
          isActive && "opacity-100",
          "hover:bg-flux-border hover:text-flux-text",
          "text-flux-muted"
        )}
      >
        {tab.isDirty ? (
          <Circle size={8} fill="currentColor" className="text-flux-accent" />
        ) : (
          <X size={12} />
        )}
      </button>
    </div>
  );
}
