import { useRef, useState } from "react";
import {
  GitBranch,
  Zap,
  AlertCircle,
  Loader2,
  Power,
  PowerOff,
  Settings2,
  Cpu,
  Check,
  ChevronUp,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { useAIStore } from "@/store/aiStore";
import { useFileStore } from "@/store/fileStore";
import { useUIStore } from "@/store/uiStore";
import { MenuPanel, MenuItem, MenuSeparator, MenuLabel } from "@/components/common/MenuPanel";
import { cn } from "@/services/utils";

export function StatusBar() {
  const { position, getActiveTab } = useEditorStore();
  const { status, isStreaming } = useAIStore();
  const { workspacePath } = useFileStore();

  const activeTab = getActiveTab();
  const workspaceName = workspacePath?.split(/[/\\]/).pop() ?? "";

  return (
    <div className="flex items-center h-6 bg-flux-accent text-white text-2xs px-2 gap-3 shrink-0 select-none">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {workspaceName && (
          <div className="flex items-center gap-1 opacity-90">
            <GitBranch size={11} />
            <span>{workspaceName}</span>
          </div>
        )}
      </div>

      {/* Center — file path */}
      <div className="flex-1 text-center opacity-80 truncate">
        {activeTab?.path && <span className="text-2xs">{activeTab.path}</span>}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Position */}
        {activeTab && (
          <span>
            Ln {position.line}, Col {position.column}
          </span>
        )}

        {/* Language */}
        {activeTab && <span className="opacity-80">{activeTab.language}</span>}

        {/* AI Status — click for details & controls */}
        <AIStatusButton isStreaming={isStreaming} status={status} />
      </div>
    </div>
  );
}

interface AIStatusButtonProps {
  isStreaming: boolean;
  status: ReturnType<typeof useAIStore.getState>["status"];
}

function AIStatusButton({ isStreaming, status }: AIStatusButtonProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        title="AI engine details"
        className="flex items-center gap-1 px-1 -mx-1 h-6 rounded hover:bg-white/15 transition-colors"
      >
        {isStreaming ? (
          <>
            <Loader2 size={11} className="animate-spin" />
            <span>AI Generating…</span>
          </>
        ) : status.engine_running ? (
          <>
            <Zap size={11} />
            <span>{status.active_model ?? "AI Ready"}</span>
          </>
        ) : status.loading ? (
          <>
            <Loader2 size={11} className="animate-spin" />
            <span>Starting AI…</span>
          </>
        ) : (
          <>
            <AlertCircle size={11} />
            <span>AI Offline</span>
          </>
        )}
        <ChevronUp size={10} className={cn("opacity-70 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <MenuPanel
          anchor={btnRef.current?.getBoundingClientRect() ?? null}
          placement="top-end"
          width={300}
          onClose={() => setOpen(false)}
        >
          <AIDetailsContent onClose={() => setOpen(false)} />
        </MenuPanel>
      )}
    </>
  );
}

function AIDetailsContent({ onClose }: { onClose: () => void }) {
  const { status, models, downloadedModels, startEngine, stopEngine, setActiveModel } =
    useAIStore();
  const { setActiveView } = useUIStore();

  const activeModel = models.find(
    (m) => m.id === status.active_model || m.name === status.active_model
  );

  const stateLabel = status.engine_running
    ? "Running"
    : status.loading
    ? "Starting…"
    : status.error
    ? "Error"
    : "Offline";
  const stateColor = status.engine_running
    ? "text-flux-success"
    : status.loading
    ? "text-flux-warning"
    : "text-flux-muted";

  return (
    <div>
      {/* Header / details */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-flux-accent/20 border border-flux-accent/30 flex items-center justify-center">
            <Cpu size={15} className="text-flux-accent" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-flux-text truncate">
              {activeModel?.name ?? status.active_model ?? "No model loaded"}
            </div>
            <div className={cn("text-2xs font-medium", stateColor)}>● {stateLabel}</div>
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-2xs">
          <Detail label="Parameters" value={activeModel?.parameters ?? "—"} />
          <Detail label="Context" value={activeModel ? `${activeModel.context_length.toLocaleString()} tok` : "—"} />
          <Detail label="Size" value={activeModel ? `${activeModel.size_gb} GB` : "—"} />
          <Detail label="Runs" value="Locally" />
        </div>

        {status.server_url && (
          <div className="mt-1.5 text-2xs text-flux-muted truncate">
            Server: <span className="text-flux-text">{status.server_url}</span>
          </div>
        )}
        {status.error && (
          <div className="mt-1.5 text-2xs text-flux-error truncate" title={status.error}>
            {status.error}
          </div>
        )}
      </div>

      <MenuSeparator />

      {/* Engine controls */}
      {status.engine_running ? (
        <MenuItem
          icon={<PowerOff size={13} />}
          label="Stop AI Engine"
          onClick={() => {
            stopEngine().catch(console.error);
            onClose();
          }}
        />
      ) : (
        <MenuItem
          icon={<Power size={13} />}
          label={status.loading ? "Starting…" : "Start AI Engine"}
          disabled={status.loading}
          onClick={() => {
            startEngine().catch(console.error);
            onClose();
          }}
        />
      )}

      {/* Model switcher */}
      {models.length > 0 && (
        <>
          <MenuSeparator />
          <MenuLabel>Switch Model</MenuLabel>
          <div className="max-h-44 overflow-y-auto">
            {models.map((m) => {
              const isActive = m.id === status.active_model || m.name === status.active_model;
              const isDownloaded = downloadedModels.includes(m.id);
              return (
                <MenuItem
                  key={m.id}
                  icon={isActive ? <Check size={13} /> : <span />}
                  disabled={!isDownloaded}
                  label={
                    <span className="flex flex-col">
                      <span>{m.name}</span>
                      <span className="text-2xs text-flux-muted">
                        {isDownloaded ? `${m.parameters} · ${m.size_gb} GB` : "Not downloaded"}
                      </span>
                    </span>
                  }
                  active={isActive}
                  onClick={() => {
                    if (!isActive && isDownloaded) setActiveModel(m.id).catch(console.error);
                    onClose();
                  }}
                />
              );
            })}
          </div>
        </>
      )}

      <MenuSeparator />
      <MenuItem
        icon={<Settings2 size={13} />}
        label="Open AI Settings"
        onClick={() => {
          setActiveView("settings");
          onClose();
        }}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-flux-surface border border-flux-border rounded px-2 py-1">
      <div className="text-flux-muted">{label}</div>
      <div className="text-flux-text font-medium mt-0.5 truncate">{value}</div>
    </div>
  );
}
