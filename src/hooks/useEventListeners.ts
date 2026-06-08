import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useAIStore } from "@/store/aiStore";
import { ModelStatus, DownloadProgress } from "@/types";

export function useEventListeners() {
  const { loadModelStatus, loadDownloadedModels } = useAIStore();

  useEffect(() => {
    const unlisteners: (() => void)[] = [];

    // AI status changes
    listen<ModelStatus>("ai-status-changed", (event) => {
      useAIStore.setState({ status: event.payload });
    }).then((fn) => unlisteners.push(fn));

    // Model download progress
    listen<DownloadProgress>("model-download-progress", (event) => {
      const { model_id, progress } = event.payload;
      useAIStore.setState((state) => ({
        downloadProgress: { ...state.downloadProgress, [model_id]: progress },
      }));
    }).then((fn) => unlisteners.push(fn));

    // Model download complete
    listen<{ model_id: string }>("model-download-complete", (event) => {
      const { model_id } = event.payload;
      useAIStore.setState((state) => ({
        downloadProgress: { ...state.downloadProgress, [model_id]: 100 },
      }));
      loadModelStatus();
      loadDownloadedModels();
    }).then((fn) => unlisteners.push(fn));

    return () => {
      unlisteners.forEach((fn) => fn());
    };
  }, [loadModelStatus, loadDownloadedModels]);
}
