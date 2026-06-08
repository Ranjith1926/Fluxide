use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use parking_lot::Mutex;
use tokio::sync::Mutex as AsyncMutex;
use tauri::Manager;

pub mod ai;
pub mod commands;
pub mod filesystem;
pub mod terminal;
pub mod workspace;

use ai::manager::AiManager;
use terminal::TerminalManager;
use workspace::WorkspaceManager;

pub struct AppState {
    pub ai_manager: Arc<AsyncMutex<AiManager>>,
    pub terminal_manager: Arc<Mutex<TerminalManager>>,
    pub workspace_manager: Arc<Mutex<WorkspaceManager>>,
    pub cancellation: Arc<AtomicBool>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    let cancellation = Arc::new(AtomicBool::new(false));

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            ai_manager: Arc::new(AsyncMutex::new(AiManager::new())),
            terminal_manager: Arc::new(Mutex::new(TerminalManager::new())),
            workspace_manager: Arc::new(Mutex::new(WorkspaceManager::new())),
            cancellation,
        })
        .invoke_handler(tauri::generate_handler![
            // Filesystem commands
            commands::fs::open_folder,
            commands::fs::read_file,
            commands::fs::write_file,
            commands::fs::rename_file,
            commands::fs::delete_file,
            commands::fs::create_file,
            commands::fs::create_directory,
            commands::fs::list_directory,
            commands::fs::file_exists,
            // Terminal commands
            commands::terminal::create_terminal,
            commands::terminal::write_terminal,
            commands::terminal::resize_terminal,
            commands::terminal::close_terminal,
            // AI commands
            commands::ai::start_ai_engine,
            commands::ai::stop_ai_engine,
            commands::ai::stream_completion,
            commands::ai::cancel_generation,
            commands::ai::get_model_status,
            commands::ai::download_model,
            commands::ai::list_models,
            commands::ai::list_downloaded_models,
            commands::ai::set_active_model,
            // Workspace commands
            commands::workspace::get_workspace_info,
            commands::workspace::search_workspace,
            commands::workspace::index_workspace,
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Ensure the window/taskbar shows the FluxIDE icon (dev builds don't
            // always pick up the bundle icon automatically).
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_icon(tauri::include_image!("icons/128x128.png"));
            }

            let state = app.state::<AppState>();
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");

            // Set data_dir and kick off auto-start in a single async task.
            // blocking_lock() panics in async contexts, so we do everything inside the spawn.
            let ai_manager = Arc::clone(&state.ai_manager);
            let handle_clone = app_handle.clone();
            // tauri::async_runtime::spawn works from sync setup; tokio::spawn does not
            tauri::async_runtime::spawn(async move {
                {
                    let mut manager = ai_manager.lock().await;
                    manager.set_data_dir(data_dir);
                } // lock released before initialize
                let mut manager = ai_manager.lock().await;
                if let Err(e) = manager.initialize(handle_clone).await {
                    log::info!("AI engine will start after model download: {}", e);
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running FluxIDE");
}
