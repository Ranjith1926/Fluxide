use std::sync::Arc;
use std::sync::atomic::Ordering;
use tauri::{AppHandle, State, Emitter};
use tauri::ipc::Channel;

use crate::AppState;
use crate::ai::manager::{is_valid_gguf, CompletionRequest, ServerConfig, StreamEvent};
use crate::ai::models::{ModelInfo, ModelStatus, find_model_by_id, get_available_models};
use crate::ai::prompts::SYSTEM_CODING_ASSISTANT;
use crate::ai::inference::InferenceEngine;

#[tauri::command]
pub async fn start_ai_engine(
    app_handle: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut manager = state.ai_manager.lock().await;
    manager.start(app_handle).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn stop_ai_engine(state: State<'_, AppState>) -> Result<(), String> {
    let mut manager = state.ai_manager.lock().await;
    manager.stop().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn stream_completion(
    state: State<'_, AppState>,
    request: CompletionRequest,
    on_event: Channel<StreamEvent>,
) -> Result<(), String> {
    // Lock briefly — only to read server config, then release before streaming
    let config: ServerConfig = {
        let manager = state.ai_manager.lock().await;
        match manager.get_server_config() {
            Some(c) => c,
            None => {
                let _ = on_event.send(StreamEvent {
                    event_type: "error".to_string(),
                    content: None,
                    error: Some(
                        "AI engine is not running. Please download and start a model.".to_string(),
                    ),
                    done: true,
                });
                return Err("AI engine not running".to_string());
            }
        }
    }; // ← mutex released here

    // Reset cancellation flag before new stream
    state.cancellation.store(false, Ordering::SeqCst);

    let system = request
        .system_prompt
        .as_deref()
        .unwrap_or(SYSTEM_CODING_ASSISTANT)
        .to_string();

    let engine = InferenceEngine::new(
        config.server_url,
        Arc::clone(&state.cancellation),
    );

    engine
        .stream_chat(
            &request.prompt,
            &system,
            &config.model_name,
            request.max_tokens.unwrap_or(2048),
            request.temperature.unwrap_or(0.7),
            on_event,
        )
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cancel_generation(state: State<'_, AppState>) -> Result<(), String> {
    state.cancellation.store(true, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
pub async fn get_model_status(state: State<'_, AppState>) -> Result<ModelStatus, String> {
    let manager = state.ai_manager.lock().await;
    Ok(manager.status.clone())
}

#[tauri::command]
pub async fn list_models(_state: State<'_, AppState>) -> Result<Vec<ModelInfo>, String> {
    Ok(get_available_models())
}

#[tauri::command]
pub async fn list_downloaded_models(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let manager = state.ai_manager.lock().await;
    Ok(manager.list_downloaded_model_ids())
}

#[tauri::command]
pub async fn set_active_model(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    model_id: String,
) -> Result<(), String> {
    let mut manager = state.ai_manager.lock().await;
    manager
        .set_active_model(app_handle, &model_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn download_model(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    model_id: String,
) -> Result<(), String> {
    // Brief lock to get file path info
    let (url, dest_path, size_gb) = {
        let manager = state.ai_manager.lock().await;
        let model = find_model_by_id(&model_id)
            .ok_or_else(|| format!("Unknown model: {}", model_id))?;
        (
            model.download_url.clone(),
            manager.get_models_dir().join(&model.filename),
            model.size_gb,
        )
    }; // lock released

    // Already present and valid → nothing to do.
    if is_valid_gguf(&dest_path, size_gb) {
        log::info!("Model {} already downloaded at {:?}", model_id, dest_path);
        let _ = app_handle.emit(
            "model-download-complete",
            serde_json::json!({ "model_id": model_id }),
        );
        return Ok(());
    }
    // Remove a stale/corrupt/partial leftover so we start clean.
    let _ = std::fs::remove_file(&dest_path);

    if let Some(parent) = dest_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create models directory: {}", e))?;
    }

    // Download into a temp file, then rename on success — a failed/partial
    // download never leaves a file that looks valid.
    let tmp_path = dest_path.with_extension("part");
    let _ = std::fs::remove_file(&tmp_path);

    log::info!("Downloading {} from {}", model_id, url);
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Download request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Download failed: server returned {}. The model URL may have moved.",
            response.status()
        ));
    }

    let total = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut last_pct: u8 = 255;

    let mut file = tokio::fs::File::create(&tmp_path)
        .await
        .map_err(|e| format!("Failed to create file: {}", e))?;

    use futures::StreamExt;
    use tokio::io::AsyncWriteExt;

    let mut stream = response.bytes_stream();
    while let Some(chunk_result) = stream.next().await {
        let chunk = match chunk_result {
            Ok(c) => c,
            Err(e) => {
                let _ = tokio::fs::remove_file(&tmp_path).await;
                return Err(format!("Download interrupted: {}", e));
            }
        };
        if let Err(e) = file.write_all(&chunk).await {
            let _ = tokio::fs::remove_file(&tmp_path).await;
            return Err(format!("Write error: {}", e));
        }
        downloaded += chunk.len() as u64;

        if total > 0 {
            let pct = ((downloaded as f64 / total as f64) * 100.0) as u8;
            if pct != last_pct {
                last_pct = pct;
                let _ = app_handle.emit(
                    "model-download-progress",
                    serde_json::json!({
                        "model_id": model_id,
                        "progress": pct,
                        "downloaded": downloaded,
                        "total": total
                    }),
                );
            }
        }
    }
    file.flush().await.map_err(|e| format!("Flush error: {}", e))?;
    drop(file);

    // Verify the download is complete before accepting it.
    if total > 0 && downloaded != total {
        let _ = std::fs::remove_file(&tmp_path);
        return Err(format!(
            "Download incomplete ({} of {} bytes). Please try again.",
            downloaded, total
        ));
    }
    if !is_valid_gguf(&tmp_path, size_gb) {
        let _ = std::fs::remove_file(&tmp_path);
        return Err(
            "Downloaded file failed validation (not a valid GGUF model). Please try again."
                .to_string(),
        );
    }

    // Atomically promote the temp file to the final name.
    std::fs::rename(&tmp_path, &dest_path)
        .map_err(|e| format!("Failed to finalize download: {}", e))?;

    let _ = app_handle.emit(
        "model-download-complete",
        serde_json::json!({ "model_id": model_id }),
    );
    log::info!("Model {} download complete", model_id);
    Ok(())
}
