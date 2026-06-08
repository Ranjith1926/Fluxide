use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    pub filename: String,
    pub size_gb: f32,
    pub download_url: String,
    pub parameters: String,
    pub context_length: u32,
    pub recommended: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelStatus {
    pub loaded: bool,
    pub loading: bool,
    pub active_model: Option<String>,
    pub engine_running: bool,
    pub error: Option<String>,
    pub server_url: Option<String>,
}

impl Default for ModelStatus {
    fn default() -> Self {
        Self {
            loaded: false,
            loading: false,
            active_model: None,
            engine_running: false,
            error: None,
            server_url: None,
        }
    }
}

pub fn get_available_models() -> Vec<ModelInfo> {
    vec![
        ModelInfo {
            id: "qwen2.5-coder-1.5b".to_string(),
            name: "Qwen2.5-Coder 1.5B".to_string(),
            description: "Fast, efficient coding model. Great for code completion and explanation.".to_string(),
            filename: "qwen2.5-coder-1.5b-instruct-q4_k_m.gguf".to_string(),
            size_gb: 1.0,
            download_url: "https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF/resolve/main/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf".to_string(),
            parameters: "1.5B".to_string(),
            context_length: 32768,
            recommended: true,
        },
        ModelInfo {
            id: "qwen2.5-coder-7b".to_string(),
            name: "Qwen2.5-Coder 7B".to_string(),
            description: "Balanced coding model with strong performance across languages.".to_string(),
            filename: "qwen2.5-coder-7b-instruct-q4_k_m.gguf".to_string(),
            size_gb: 4.7,
            download_url: "https://huggingface.co/Qwen/Qwen2.5-Coder-7B-Instruct-GGUF/resolve/main/qwen2.5-coder-7b-instruct-q4_k_m.gguf".to_string(),
            parameters: "7B".to_string(),
            context_length: 32768,
            recommended: false,
        },
        ModelInfo {
            id: "deepseek-coder-1.3b".to_string(),
            name: "DeepSeek-Coder 1.3B".to_string(),
            description: "Ultra-lightweight coding model for fast inference on low-end hardware.".to_string(),
            filename: "deepseek-coder-1.3b-instruct.Q4_K_M.gguf".to_string(),
            size_gb: 0.8,
            download_url: "https://huggingface.co/TheBloke/deepseek-coder-1.3b-instruct-GGUF/resolve/main/deepseek-coder-1.3b-instruct.Q4_K_M.gguf".to_string(),
            parameters: "1.3B".to_string(),
            context_length: 16384,
            recommended: false,
        },
        ModelInfo {
            id: "phi-3-mini".to_string(),
            name: "Phi-3 Mini 3.8B".to_string(),
            description: "Microsoft's compact model with strong reasoning and coding abilities.".to_string(),
            filename: "Phi-3-mini-4k-instruct-q4.gguf".to_string(),
            size_gb: 2.2,
            download_url: "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf".to_string(),
            parameters: "3.8B".to_string(),
            context_length: 4096,
            recommended: false,
        },
    ]
}

pub fn find_model_by_id(id: &str) -> Option<ModelInfo> {
    get_available_models().into_iter().find(|m| m.id == id)
}
