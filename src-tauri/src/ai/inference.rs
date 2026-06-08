use anyhow::{anyhow, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::ipc::Channel;

use crate::ai::manager::StreamEvent;

#[derive(Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    stream: bool,
    temperature: f32,
    max_tokens: i32,
}

#[derive(Deserialize)]
struct ChatDelta {
    content: Option<String>,
}

#[derive(Deserialize)]
struct ChatChoice {
    delta: ChatDelta,
    finish_reason: Option<String>,
}

#[derive(Deserialize)]
struct ChatChunk {
    choices: Vec<ChatChoice>,
}

pub struct InferenceEngine {
    client: Client,
    base_url: String,
    cancelled: Arc<AtomicBool>,
}

impl InferenceEngine {
    pub fn new(base_url: String, cancelled: Arc<AtomicBool>) -> Self {
        Self {
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(300))
                .build()
                .expect("Failed to build HTTP client"),
            base_url,
            cancelled,
        }
    }

    pub async fn is_healthy(&self) -> bool {
        self.client
            .get(format!("{}/health", self.base_url))
            .send()
            .await
            .map(|r| r.status().is_success())
            .unwrap_or(false)
    }

    pub async fn stream_chat(
        &self,
        prompt: &str,
        system_prompt: &str,
        model_name: &str,
        max_tokens: u32,
        temperature: f32,
        on_event: Channel<StreamEvent>,
    ) -> Result<()> {
        let request = ChatRequest {
            model: model_name.to_string(),
            messages: vec![
                ChatMessage { role: "system".to_string(), content: system_prompt.to_string() },
                ChatMessage { role: "user".to_string(), content: prompt.to_string() },
            ],
            stream: true,
            temperature,
            max_tokens: max_tokens as i32,
        };

        let response = self
            .client
            .post(format!("{}/v1/chat/completions", self.base_url))
            .json(&request)
            .send()
            .await
            .map_err(|e| anyhow!("Failed to connect to AI engine: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(anyhow!("AI engine returned {}: {}", status, body));
        }

        let _ = on_event.send(StreamEvent {
            event_type: "start".to_string(),
            content: None,
            error: None,
            done: false,
        });

        use futures::StreamExt;
        let mut byte_stream = response.bytes_stream();
        let mut buf = String::new();

        while let Some(chunk) = byte_stream.next().await {
            if self.cancelled.load(Ordering::Relaxed) {
                let _ = on_event.send(StreamEvent {
                    event_type: "cancelled".to_string(),
                    content: None,
                    error: None,
                    done: true,
                });
                return Ok(());
            }

            let bytes = chunk.map_err(|e| anyhow!("Stream chunk error: {}", e))?;
            buf.push_str(&String::from_utf8_lossy(&bytes));

            while let Some(nl) = buf.find('\n') {
                let line = buf[..nl].trim().to_string();
                buf = buf[nl + 1..].to_string();

                if let Some(data) = line.strip_prefix("data: ") {
                    if data == "[DONE]" {
                        let _ = on_event.send(StreamEvent {
                            event_type: "done".to_string(),
                            content: None,
                            error: None,
                            done: true,
                        });
                        return Ok(());
                    }
                    if let Ok(parsed) = serde_json::from_str::<ChatChunk>(data) {
                        if let Some(choice) = parsed.choices.first() {
                            if let Some(text) = &choice.delta.content {
                                if !text.is_empty() {
                                    let _ = on_event.send(StreamEvent {
                                        event_type: "token".to_string(),
                                        content: Some(text.clone()),
                                        error: None,
                                        done: false,
                                    });
                                }
                            }
                            if choice.finish_reason.is_some() {
                                let _ = on_event.send(StreamEvent {
                                    event_type: "done".to_string(),
                                    content: None,
                                    error: None,
                                    done: true,
                                });
                                return Ok(());
                            }
                        }
                    }
                }
            }
        }

        let _ = on_event.send(StreamEvent {
            event_type: "done".to_string(),
            content: None,
            error: None,
            done: true,
        });
        Ok(())
    }
}
