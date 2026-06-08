import { Plus, X, ChevronDown, Terminal as TerminalIcon } from "lucide-react";
import { useTerminalStore } from "@/store/terminalStore";
import { useFileStore } from "@/store/fileStore";
import { useUIStore } from "@/store/uiStore";
import { Terminal } from "./Terminal";
import { cn } from "@/services/utils";

export function TerminalPanel() {
  const { sessions, activeSessionId, createSession, closeSession, setActiveSession } =
    useTerminalStore();
  const { workspacePath } = useFileStore();
  const { toggleTerminal } = useUIStore();

  const handleNewTerminal = async () => {
    await createSession(workspacePath ?? undefined);
  };

  // Auto-create a terminal if none exist
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <TerminalHeader
          sessions={[]}
          activeSessionId={null}
          onNew={handleNewTerminal}
          onClose={() => {}}
          onActivate={() => {}}
          onHide={toggleTerminal}
        />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <TerminalIcon size={24} className="text-flux-muted/50" />
          <p className="text-xs text-flux-muted">No terminal sessions</p>
          <button
            onClick={handleNewTerminal}
            className="px-3 py-1.5 text-xs bg-flux-accent/20 hover:bg-flux-accent/30 text-flux-accent border border-flux-accent/30 rounded transition-colors"
          >
            New Terminal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TerminalHeader
        sessions={sessions.map((s) => ({ id: s.id, title: s.title }))}
        activeSessionId={activeSessionId}
        onNew={handleNewTerminal}
        onClose={closeSession}
        onActivate={setActiveSession}
        onHide={toggleTerminal}
      />

      {/* Terminal instances */}
      <div className="flex-1 overflow-hidden relative">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={cn(
              "absolute inset-0 bg-flux-bg",
              session.id === activeSessionId ? "block" : "hidden"
            )}
          >
            <Terminal
              sessionId={session.id}
              isActive={session.id === activeSessionId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface TerminalHeaderProps {
  sessions: { id: string; title: string }[];
  activeSessionId: string | null;
  onNew: () => void;
  onClose: (id: string) => void;
  onActivate: (id: string) => void;
  onHide: () => void;
}

function TerminalHeader({
  sessions,
  activeSessionId,
  onNew,
  onClose,
  onActivate,
  onHide,
}: TerminalHeaderProps) {
  return (
    <div className="flex items-center h-8 bg-flux-bg border-b border-flux-border shrink-0 overflow-x-auto">
      <div className="flex items-center gap-0 flex-1 overflow-x-auto">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onActivate(session.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 h-8 text-xs cursor-pointer border-r border-flux-border shrink-0 group transition-colors",
              session.id === activeSessionId
                ? "bg-flux-surface text-flux-text"
                : "text-flux-muted hover:text-flux-text hover:bg-flux-surface/50"
            )}
          >
            <TerminalIcon size={11} />
            <span className="max-w-[100px] truncate">{session.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(session.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-flux-error transition-all"
            >
              <X size={11} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onNew}
        title="New Terminal"
        className="flex items-center justify-center w-8 h-8 text-flux-muted hover:text-flux-text hover:bg-flux-surface transition-colors shrink-0"
      >
        <Plus size={14} />
      </button>

      <button
        onClick={onHide}
        title="Hide Terminal (Ctrl+`)"
        className="flex items-center justify-center w-8 h-8 text-flux-muted hover:text-flux-text hover:bg-flux-surface transition-colors shrink-0"
      >
        <ChevronDown size={15} />
      </button>
    </div>
  );
}
