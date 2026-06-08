use anyhow::{anyhow, Result};
use portable_pty::{CommandBuilder, PtySize, native_pty_system};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Arc;
use parking_lot::Mutex;
use tauri::{AppHandle, Emitter};
use uuid::Uuid;

struct TerminalSession {
    writer: Box<dyn Write + Send>,
}

pub struct TerminalManager {
    sessions: HashMap<String, Arc<Mutex<TerminalSession>>>,
}

impl TerminalManager {
    pub fn new() -> Self {
        Self {
            sessions: HashMap::new(),
        }
    }

    /// Create a new PTY session. Synchronous — spawns a std::thread for the reader loop.
    pub fn create_session(
        &mut self,
        app_handle: AppHandle,
        cwd: Option<String>,
    ) -> Result<String> {
        let session_id = Uuid::new_v4().to_string();

        let pty_system = native_pty_system();
        let pair = pty_system
            .openpty(PtySize { rows: 24, cols: 80, pixel_width: 0, pixel_height: 0 })
            .map_err(|e| anyhow!("Failed to open PTY: {}", e))?;

        let shell = default_shell();
        let mut cmd = CommandBuilder::new(&shell);
        cmd.env("TERM", "xterm-256color");
        cmd.env("COLORTERM", "truecolor");
        if let Some(dir) = &cwd {
            cmd.cwd(dir);
        }

        pair.slave.spawn_command(cmd)
            .map_err(|e| anyhow!("Failed to spawn shell '{}': {}", shell, e))?;

        let writer = pair.master.take_writer()
            .map_err(|e| anyhow!("Failed to get PTY writer: {}", e))?;

        let mut reader = pair.master.try_clone_reader()
            .map_err(|e| anyhow!("Failed to get PTY reader: {}", e))?;

        let session = Arc::new(Mutex::new(TerminalSession { writer }));
        self.sessions.insert(session_id.clone(), Arc::clone(&session));

        // Spawn a blocking thread for the reader loop
        let sid = session_id.clone();
        let handle = app_handle.clone();
        std::thread::spawn(move || {
            let mut buf = [0u8; 4096];
            loop {
                match reader.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => {
                        let data = String::from_utf8_lossy(&buf[..n]).to_string();
                        let _ = handle.emit(
                            &format!("terminal-output-{}", sid),
                            serde_json::json!({ "data": data }),
                        );
                    }
                    Err(_) => break,
                }
            }
            let _ = handle.emit(
                &format!("terminal-exit-{}", sid),
                serde_json::json!({ "code": 0 }),
            );
        });

        Ok(session_id)
    }

    pub fn write_to_session(&self, session_id: &str, data: &str) -> Result<()> {
        let session = self.sessions.get(session_id)
            .ok_or_else(|| anyhow!("Session not found: {}", session_id))?;
        let mut s = session.lock();
        s.writer.write_all(data.as_bytes())
            .map_err(|e| anyhow!("Write error: {}", e))?;
        s.writer.flush().ok();
        Ok(())
    }

    pub fn resize_session(&self, _session_id: &str, _cols: u16, _rows: u16) -> Result<()> {
        // Resize is a best-effort operation; master is consumed by take_writer so
        // we skip it here. A future version can store the master in Arc<Mutex<>>.
        Ok(())
    }

    pub fn close_session(&mut self, session_id: &str) -> Result<()> {
        self.sessions.remove(session_id);
        Ok(())
    }
}

fn default_shell() -> String {
    if cfg!(windows) {
        std::env::var("COMSPEC")
            .unwrap_or_else(|_| "powershell.exe".to_string())
    } else {
        std::env::var("SHELL")
            .unwrap_or_else(|_| "/bin/bash".to_string())
    }
}
