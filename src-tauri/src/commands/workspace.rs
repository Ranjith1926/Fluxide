use tauri::State;

use crate::AppState;
use crate::workspace::{WorkspaceInfo, SearchResult};

#[tauri::command]
pub async fn get_workspace_info(
    state: State<'_, AppState>,
) -> Result<Option<WorkspaceInfo>, String> {
    let manager = state.workspace_manager.lock();
    Ok(manager.get_info())
}

#[tauri::command]
pub async fn search_workspace(
    state: State<'_, AppState>,
    query: String,
    file_pattern: Option<String>,
) -> Result<Vec<SearchResult>, String> {
    let manager = state.workspace_manager.lock();
    manager
        .search(&query, file_pattern.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn index_workspace(
    state: State<'_, AppState>,
    path: String,
) -> Result<(), String> {
    let mut manager = state.workspace_manager.lock();
    manager.index(&path).map_err(|e| e.to_string())
}
