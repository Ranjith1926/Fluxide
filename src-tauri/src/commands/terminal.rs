use tauri::{AppHandle, State};

use crate::AppState;

#[tauri::command]
pub async fn create_terminal(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    cwd: Option<String>,
) -> Result<String, String> {
    let mut manager = state.terminal_manager.lock();
    manager
        .create_session(app_handle, cwd)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_terminal(
    state: State<'_, AppState>,
    session_id: String,
    data: String,
) -> Result<(), String> {
    let manager = state.terminal_manager.lock();
    manager
        .write_to_session(&session_id, &data)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn resize_terminal(
    state: State<'_, AppState>,
    session_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let manager = state.terminal_manager.lock();
    manager
        .resize_session(&session_id, cols, rows)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn close_terminal(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<(), String> {
    let mut manager = state.terminal_manager.lock();
    manager
        .close_session(&session_id)
        .map_err(|e| e.to_string())
}
