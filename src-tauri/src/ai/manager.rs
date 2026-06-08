use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::{Child, Command};
use tauri::{AppHandle, Emitter};

use super::models::{get_available_models, find_model_by_id, ModelInfo, ModelStatus};

const LLAMA_SERVER_PORT: u16 = 8765;

// ─── Shared types (used by commands/ai.rs) ────────────────────────────────────

#[derive(Debug, Deserialize, Clone)]
pub struct CompletionRequest {
    pub prompt: String,
    pub system_prompt: Option<String>,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
    pub context_files: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Clone)]
pub struct StreamEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub content: Option<String>,
    pub error: Option<String>,
    pub done: bool,
}

/// Cloneable server config extracted without holding the manager lock
#[derive(Clone)]
pub struct ServerConfig {
    pub server_url: String,
    pub model_name: String,
}

// ─── Manager ─────────────────────────────────────────────────────────────────

pub struct AiManager {
    data_dir: PathBuf,
    server_process: Option<Child>,
    pub status: ModelStatus,
    pub active_model_id: Option<String>,
}

impl AiManager {
    pub fn new() -> Self {
        Self {
            data_dir: PathBuf::new(),
            server_process: None,
            status: ModelStatus::default(),
            active_model_id: None,
        }
    }

    pub fn set_data_dir(&mut self, dir: PathBuf) {
        self.data_dir = dir;
    }

    pub fn get_models_dir(&self) -> PathBuf {
        self.data_dir.join("models")
    }

    pub fn get_bin_dir(&self) -> PathBuf {
        self.data_dir.join("bin")
    }

    /// Return server config without holding the mutex during streaming
    pub fn get_server_config(&self) -> Option<ServerConfig> {
        if self.status.engine_running {
            Some(ServerConfig {
                server_url: self.status.server_url.clone()
                    .unwrap_or_else(|| format!("http://127.0.0.1:{}", LLAMA_SERVER_PORT)),
                model_name: self.active_model_id.clone()
                    .unwrap_or_else(|| "default".to_string()),
            })
        } else {
            None
        }
    }

    pub fn is_model_downloaded(&self, model_id: &str) -> bool {
        find_model_by_id(model_id)
            .map(|m| is_valid_gguf(&self.get_models_dir().join(&m.filename), m.size_gb))
            .unwrap_or(false)
    }

    pub async fn initialize(&mut self, app_handle: AppHandle) -> Result<()> {
        std::fs::create_dir_all(self.get_models_dir())?;
        std::fs::create_dir_all(self.get_bin_dir())?;

        // Auto-start with the first downloaded model
        let all = get_available_models();
        if let Some(model) = all.iter().find(|m| self.is_model_downloaded(&m.id)) {
            log::info!("Auto-starting with model: {}", model.id);
            self.active_model_id = Some(model.id.clone());
            self.start(app_handle).await.ok();
        }
        Ok(())
    }

    pub async fn start(&mut self, app_handle: AppHandle) -> Result<()> {
        if self.status.engine_running {
            return Ok(());
        }

        let model_id = match &self.active_model_id {
            Some(id) => id.clone(),
            None => {
                let all = get_available_models();
                all.iter()
                    .find(|m| self.is_model_downloaded(&m.id))
                    .map(|m| m.id.clone())
                    .ok_or_else(|| anyhow!("No models downloaded"))?
            }
        };

        let model = find_model_by_id(&model_id)
            .ok_or_else(|| anyhow!("Unknown model: {}", model_id))?;
        let model_path = self.get_models_dir().join(&model.filename);

        if !model_path.exists() {
            return Err(anyhow!("Model file not found: {:?}", model_path));
        }

        self.status.loading = true;
        self.status.error = None;
        let _ = app_handle.emit("ai-status-changed", &self.status);

        // Surface a spawn failure (e.g. llama-server not installed) to the UI.
        let child = match self.spawn_llama_server(&model_path) {
            Ok(c) => c,
            Err(e) => {
                self.status.loading = false;
                self.status.error = Some(e.to_string());
                let _ = app_handle.emit("ai-status-changed", &self.status);
                return Err(e);
            }
        };
        self.server_process = Some(child);

        // Poll server readiness. Large models can take a while to load into RAM,
        // so allow up to ~120 s — but fail fast if the process dies (e.g. a
        // corrupt model file makes llama-server exit immediately).
        let health_url = format!("http://127.0.0.1:{}/health", LLAMA_SERVER_PORT);
        let client = reqwest::Client::new();
        let mut ready = false;
        let mut exit_error: Option<String> = None;

        for _ in 0..240 {
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

            // Did llama-server exit on its own (failed to load the model)?
            if let Some(child) = self.server_process.as_mut() {
                if let Ok(Some(status)) = child.try_wait() {
                    exit_error = Some(format!(
                        "The AI engine exited while loading the model (exit {:?}). \
                         The model file is likely corrupt or incomplete — re-download it.",
                        status.code()
                    ));
                    break;
                }
            }

            if client
                .get(&health_url)
                .send()
                .await
                .map(|r| r.status().is_success())
                .unwrap_or(false)
            {
                ready = true;
                break;
            }
        }

        if let Some(err) = exit_error {
            self.server_process = None;
            self.status.loading = false;
            self.status.error = Some(err.clone());
            let _ = app_handle.emit("ai-status-changed", &self.status);
            return Err(anyhow!(err));
        }

        if !ready {
            // Kill the lingering process so it doesn't hold the port.
            if let Some(mut child) = self.server_process.take() {
                let _ = child.kill();
                let _ = child.wait();
            }
            self.status.loading = false;
            self.status.error = Some("AI engine did not become ready within 120 s.".to_string());
            let _ = app_handle.emit("ai-status-changed", &self.status);
            return Err(anyhow!("llama-server startup timeout"));
        }

        self.active_model_id = Some(model_id.clone());
        self.status = ModelStatus {
            loaded: true,
            loading: false,
            active_model: Some(model_id),
            engine_running: true,
            error: None,
            server_url: Some(format!("http://127.0.0.1:{}", LLAMA_SERVER_PORT)),
        };
        let _ = app_handle.emit("ai-status-changed", &self.status);
        log::info!("AI engine ready");
        Ok(())
    }

    fn spawn_llama_server(&self, model_path: &PathBuf) -> Result<Child> {
        let binary = self.find_llama_server_binary()?;
        let threads = std::thread::available_parallelism()
            .map(|n| n.get().min(8)).unwrap_or(4).to_string();

        let mut cmd = Command::new(&binary);
        cmd.args([
                "--model",    model_path.to_str().unwrap_or_default(),
                "--port",     &LLAMA_SERVER_PORT.to_string(),
                "--host",     "127.0.0.1",
                "--ctx-size", "4096",
                "--n-predict","-1",
                "--threads",  &threads,
                "--batch-size","512",
            ])
            // The server logs are noisy and irrelevant to the user; discard them.
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null());

        // On Windows, spawning a console-subsystem binary from the GUI app pops up
        // its own console window. CREATE_NO_WINDOW (0x0800_0000) suppresses it.
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            cmd.creation_flags(0x0800_0000);
        }

        cmd.spawn()
            .map_err(|e| anyhow!("Failed to spawn {:?}: {}", binary, e))
    }

    fn find_llama_server_binary(&self) -> Result<PathBuf> {
        let bin = if cfg!(windows) { "llama-server.exe" } else { "llama-server" };

        let app_bin = self.get_bin_dir().join(bin);
        if app_bin.exists() { return Ok(app_bin); }

        let which = if cfg!(windows) { "where" } else { "which" };
        let mut which_cmd = Command::new(which);
        which_cmd.arg(bin);
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            which_cmd.creation_flags(0x0800_0000);
        }
        if let Ok(out) = which_cmd.output() {
            if out.status.success() {
                let s = String::from_utf8_lossy(&out.stdout).trim()
                    .lines().next().unwrap_or("").to_string();
                if !s.is_empty() { return Ok(PathBuf::from(s)); }
            }
        }

        let candidates: &[&str] = if cfg!(windows) {
            &["C:\\llama.cpp\\llama-server.exe"]
        } else if cfg!(target_os = "macos") {
            &["/usr/local/bin/llama-server", "/opt/homebrew/bin/llama-server"]
        } else {
            &["/usr/local/bin/llama-server", "/usr/bin/llama-server"]
        };
        for p in candidates {
            if PathBuf::from(p).exists() { return Ok(PathBuf::from(p)); }
        }

        Err(anyhow!(
            "{} not found. Place it in {:?} or add to PATH.",
            bin, self.get_bin_dir()
        ))
    }

    pub async fn stop(&mut self) -> Result<()> {
        if let Some(mut child) = self.server_process.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
        self.status = ModelStatus { engine_running: false, loaded: false, ..Default::default() };
        log::info!("AI engine stopped");
        Ok(())
    }

    pub fn list_models(&self) -> Vec<ModelInfo> {
        get_available_models()
    }

    /// Ids of models whose file is present on disk.
    pub fn list_downloaded_model_ids(&self) -> Vec<String> {
        get_available_models()
            .into_iter()
            .filter(|m| self.is_model_downloaded(&m.id))
            .map(|m| m.id)
            .collect()
    }

    /// Switch the active model. If the engine is running, it is restarted so the
    /// new model is actually loaded (previously this only changed a label).
    pub async fn set_active_model(&mut self, app_handle: AppHandle, model_id: &str) -> Result<()> {
        find_model_by_id(model_id)
            .ok_or_else(|| anyhow!("Unknown model: {}", model_id))?;

        if !self.is_model_downloaded(model_id) {
            return Err(anyhow!(
                "Model '{}' is not downloaded yet. Download it first.",
                model_id
            ));
        }

        // No-op if it is already the active, running model.
        if self.active_model_id.as_deref() == Some(model_id) && self.status.engine_running {
            return Ok(());
        }

        let was_running = self.status.engine_running;
        if was_running {
            self.stop().await?;
        }
        self.active_model_id = Some(model_id.to_string());
        if was_running {
            self.start(app_handle).await?;
        }
        Ok(())
    }
}

/// Cheap integrity check for a downloaded GGUF model file:
/// it must exist, start with the `GGUF` magic bytes, and be at least ~90 % of
/// the model's expected size (a truncated download fails this).
pub fn is_valid_gguf(path: &PathBuf, size_gb: f32) -> bool {
    use std::io::Read;

    let meta = match std::fs::metadata(path) {
        Ok(m) if m.is_file() => m,
        _ => return false,
    };

    let min_bytes = ((size_gb as f64) * 1_000_000_000.0 * 0.9) as u64;
    if meta.len() < min_bytes.max(1) {
        return false;
    }

    let mut magic = [0u8; 4];
    match std::fs::File::open(path).and_then(|mut f| f.read_exact(&mut magic)) {
        Ok(()) => &magic == b"GGUF",
        Err(_) => false,
    }
}
