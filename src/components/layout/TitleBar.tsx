import { useEffect, useState } from "react";
import { Zap, Minus, Square, Copy, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useFileStore } from "@/store/fileStore";
import { MenuBar } from "./MenuBar";
import { cn } from "@/services/utils";

export function TitleBar() {
  const { workspacePath } = useFileStore();
  const workspaceName = workspacePath?.split(/[/\\]/).pop() ?? "";

  return (
    <div
      data-tauri-drag-region
      className="relative flex items-center h-9 bg-flux-surface border-b border-flux-border pl-2 select-none shrink-0"
      style={{
        backgroundImage:
          "linear-gradient(to right, var(--flux-accent-glow), transparent 55%)",
      }}
    >
      {/* App icon + name */}
      <div className="flex items-center gap-2 pl-1 pr-2 shrink-0">
        <div className="flex items-center justify-center w-5 h-5 bg-flux-accent rounded">
          <Zap size={12} className="text-white" />
        </div>
        <span className="text-xs font-semibold text-flux-text">FluxIDE</span>
      </div>

      {/* VS Code-style menu bar */}
      <MenuBar />

      {/* Draggable spacer */}
      <div data-tauri-drag-region className="flex-1 h-full" />

      {workspaceName && (
        <span className="text-xs text-flux-muted px-2 truncate max-w-[30%]">
          {workspaceName}
        </span>
      )}

      {/* Window controls */}
      <WindowControls />
    </div>
  );
}

function WindowControls() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const win = getCurrentWindow();
    win.isMaximized().then(setMaximized).catch(() => {});
    const unlisten = win.onResized(() => {
      win.isMaximized().then(setMaximized).catch(() => {});
    });
    return () => {
      unlisten.then((fn) => fn()).catch(() => {});
    };
  }, []);

  const win = getCurrentWindow();

  return (
    <div className="flex items-center h-full ml-1">
      <ControlButton label="Minimize" onClick={() => win.minimize()}>
        <Minus size={15} />
      </ControlButton>
      <ControlButton
        label={maximized ? "Restore" : "Maximize"}
        onClick={() => win.toggleMaximize()}
      >
        {maximized ? <Copy size={12} className="-scale-x-100" /> : <Square size={12} />}
      </ControlButton>
      <ControlButton label="Close" danger onClick={() => win.close()}>
        <X size={16} />
      </ControlButton>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center w-11 h-9 text-flux-muted transition-colors",
        danger
          ? "hover:bg-flux-error hover:text-white"
          : "hover:bg-flux-panel hover:text-flux-text"
      )}
    >
      {children}
    </button>
  );
}
