import { useState } from "react";
import { Download, Check, Loader2, HardDrive, Zap, Play } from "lucide-react";
import { useAIStore } from "@/store/aiStore";
import { ModelInfo } from "@/types";
import { cn } from "@/services/utils";

export function ModelDownloader() {
  const {
    models,
    status,
    downloadModel,
    startEngine,
    setActiveModel,
    downloadProgress,
    downloadedModels,
  } = useAIStore();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (model: ModelInfo) => {
    setDownloading(model.id);
    setError(null);
    try {
      await downloadModel(model.id);
      // Make the freshly downloaded model active, then (re)start the engine.
      await setActiveModel(model.id);
      await startEngine();
    } catch (e) {
      setError(String(e));
    } finally {
      setDownloading(null);
    }
  };

  const handleActivate = async (model: ModelInfo) => {
    setError(null);
    try {
      await setActiveModel(model.id);
      if (!status.engine_running) await startEngine();
    } catch (e) {
      setError(String(e));
    }
  };

  const handleStart = async () => {
    setError(null);
    try {
      await startEngine();
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-flux-accent/20 border border-flux-accent/30 flex items-center justify-center mx-auto mb-3">
          <Zap size={24} className="text-flux-accent" />
        </div>
        <h2 className="text-sm font-bold text-flux-text">Choose AI Model</h2>
        <p className="text-xs text-flux-muted mt-1">
          Select a model to download and run locally
        </p>
      </div>

      {error && (
        <div className="bg-flux-error/10 border border-flux-error/30 rounded-lg p-3 text-xs text-flux-error">
          {error}
        </div>
      )}

      {/* Engine status */}
      {status.engine_running && (
        <div className="bg-flux-success/10 border border-flux-success/30 rounded-lg p-3 flex items-center gap-2">
          <Check size={14} className="text-flux-success" />
          <div>
            <div className="text-xs font-medium text-flux-success">AI Engine Running</div>
            <div className="text-2xs text-flux-muted">{status.active_model}</div>
          </div>
        </div>
      )}

      {/* Models list */}
      <div className="flex flex-col gap-2">
        {models.map((model) => {
          const isDownloading = downloading === model.id;
          const progress = downloadProgress[model.id];
          const isDownloaded = downloadedModels.includes(model.id) || progress === 100;

          return (
            <ModelCard
              key={model.id}
              model={model}
              isDownloading={isDownloading}
              isDownloaded={isDownloaded}
              progress={typeof progress === "number" ? progress : null}
              onDownload={() => handleDownload(model)}
              onActivate={() => handleActivate(model)}
              isEngineRunning={status.engine_running && status.active_model === model.id}
            />
          );
        })}
      </div>

      {/* Manual start */}
      {!status.engine_running && !status.loading && (
        <div className="border-t border-flux-border pt-3">
          <p className="text-2xs text-flux-muted mb-2 text-center">
            Already have llama-server installed?
          </p>
          <button
            onClick={handleStart}
            className="w-full py-2 text-xs bg-flux-surface hover:bg-flux-panel border border-flux-border rounded-lg text-flux-text transition-colors"
          >
            Start AI Engine
          </button>
        </div>
      )}
    </div>
  );
}

interface ModelCardProps {
  model: ModelInfo;
  isDownloading: boolean;
  isDownloaded: boolean;
  progress: number | null;
  onDownload: () => void;
  onActivate: () => void;
  isEngineRunning: boolean;
}

function ModelCard({
  model,
  isDownloading,
  isDownloaded,
  progress,
  onDownload,
  onActivate,
  isEngineRunning,
}: ModelCardProps) {
  return (
    <div
      className={cn(
        "border rounded-lg p-3 transition-all",
        model.recommended
          ? "border-flux-accent/50 bg-flux-accent/5"
          : "border-flux-border bg-flux-surface"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-flux-text">{model.name}</span>
            {model.recommended && (
              <span className="px-1.5 py-0.5 text-2xs bg-flux-accent/20 text-flux-accent rounded font-medium">
                Recommended
              </span>
            )}
            {isEngineRunning && (
              <span className="w-1.5 h-1.5 rounded-full bg-flux-success animate-pulse" />
            )}
          </div>
          <p className="text-2xs text-flux-muted mt-0.5 line-clamp-2">{model.description}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-2xs text-flux-muted font-mono flex items-center gap-1">
              <HardDrive size={10} />
              {model.size_gb} GB
            </span>
            <span className="text-2xs text-flux-muted">{model.parameters}</span>
            <span className="text-2xs text-flux-muted">{(model.context_length / 1024).toFixed(0)}K ctx</span>
          </div>
        </div>

        <div className="shrink-0">
          {isEngineRunning ? (
            <div className="px-2 py-1 text-2xs bg-flux-success/20 text-flux-success border border-flux-success/30 rounded flex items-center gap-1">
              <Check size={11} />
              Active
            </div>
          ) : isDownloading ? (
            <div className="flex flex-col items-center gap-1">
              <Loader2 size={16} className="animate-spin text-flux-accent" />
              {progress !== null && (
                <span className="text-2xs text-flux-accent">{progress}%</span>
              )}
            </div>
          ) : isDownloaded ? (
            <button
              onClick={onActivate}
              className="flex items-center gap-1 px-2 py-1 text-2xs bg-flux-success/15 hover:bg-flux-success/25 text-flux-success border border-flux-success/30 rounded transition-colors"
              title="Load this model"
            >
              <Play size={11} />
              Use
            </button>
          ) : (
            <button
              onClick={onDownload}
              className="flex items-center gap-1 px-2 py-1 text-2xs bg-flux-accent/20 hover:bg-flux-accent/30 text-flux-accent border border-flux-accent/30 rounded transition-colors"
            >
              <Download size={11} />
              Download
            </button>
          )}
        </div>
      </div>

      {/* Download progress bar */}
      {isDownloading && progress !== null && (
        <div className="mt-2">
          <div className="h-1 bg-flux-border rounded-full overflow-hidden">
            <div
              className="h-full bg-flux-accent transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
