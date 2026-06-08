import { useEffect, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ActivityBar } from "./components/layout/ActivityBar";
import { StatusBar } from "./components/layout/StatusBar";
import { TitleBar } from "./components/layout/TitleBar";
import { FileExplorer } from "./components/explorer/FileExplorer";
import { SearchPanel } from "./components/explorer/SearchPanel";
import { ExtensionsPanel } from "./components/extensions/ExtensionsPanel";
import { EditorPanel } from "./components/editor/EditorPanel";
import { TerminalPanel } from "./components/terminal/TerminalPanel";
import { ChatPanel } from "./components/ai/ChatPanel";
import { SettingsPanel } from "./components/ai/SettingsPanel";
import { useUIStore } from "./store/uiStore";
import { useAIStore } from "./store/aiStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useEventListeners } from "./hooks/useEventListeners";

export default function App() {
  // Initialize keyboard shortcuts and event listeners
  useKeyboardShortcuts();
  useEventListeners();

  const { activeView, sidebarVisible, terminalVisible, aiPanelVisible } =
    useUIStore();

  const { loadModelStatus, loadModels, loadDownloadedModels } = useAIStore();

  // Load AI status on startup
  useEffect(() => {
    loadModelStatus();
    loadModels();
    loadDownloadedModels();
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-flux-bg overflow-hidden">
      {/* Title bar (drag region) */}
      <TitleBar />

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity bar */}
        <ActivityBar />

        {/* Resizable main content */}
        <PanelGroup direction="horizontal" className="flex-1">
          {/* Left sidebar */}
          {sidebarVisible && (
            <>
              <Panel
                defaultSize={18}
                minSize={12}
                maxSize={35}
                className="flex flex-col bg-flux-bg border-r border-flux-border overflow-hidden"
              >
                <SidebarContent view={activeView} />
              </Panel>
              <ResizeHandle direction="horizontal" />
            </>
          )}

          {/* Editor + Terminal area */}
          <Panel defaultSize={aiPanelVisible ? 58 : 82} minSize={30}>
            <PanelGroup direction="vertical" className="h-full">
              {/* Editor */}
              <Panel defaultSize={terminalVisible ? 65 : 100} minSize={30}>
                <EditorPanel />
              </Panel>

              {/* Terminal */}
              {terminalVisible && (
                <>
                  <ResizeHandle direction="vertical" />
                  <Panel
                    defaultSize={35}
                    minSize={15}
                    maxSize={70}
                    className="border-t border-flux-border"
                  >
                    <TerminalPanel />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>

          {/* Right AI panel */}
          {aiPanelVisible && (
            <>
              <ResizeHandle direction="horizontal" />
              <Panel
                defaultSize={24}
                minSize={18}
                maxSize={45}
                className="flex flex-col bg-flux-bg border-l border-flux-border overflow-hidden"
              >
                {activeView === "settings" ? (
                  <SettingsPanel />
                ) : (
                  <ChatPanel />
                )}
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}

function SidebarContent({ view }: { view: string }) {
  switch (view) {
    case "explorer":
      return <FileExplorer />;
    case "search":
      return <SearchPanel />;
    case "extensions":
      return <ExtensionsPanel />;
    default:
      return <FileExplorer />;
  }
}

interface ResizeHandleProps {
  direction: "horizontal" | "vertical";
}

function ResizeHandle({ direction }: ResizeHandleProps) {
  return (
    <PanelResizeHandle
      className={`
        group relative bg-transparent hover:bg-flux-accent/20 transition-colors duration-150
        ${direction === "horizontal" ? "w-px cursor-col-resize" : "h-px cursor-row-resize"}
      `}
    >
      <div
        className={`
          absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity
          ${direction === "horizontal"
            ? "w-px bg-flux-accent/50 left-1/2 -translate-x-1/2"
            : "h-px bg-flux-accent/50 top-1/2 -translate-y-1/2"
          }
        `}
      />
    </PanelResizeHandle>
  );
}
