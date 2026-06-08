use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub extension: Option<String>,
    pub modified: Option<u64>,
}

#[allow(dead_code)]
pub struct FileWatcher {
    path: PathBuf,
}

impl FileWatcher {
    pub fn new(path: impl Into<PathBuf>) -> Self {
        Self { path: path.into() }
    }
}

/// Recursively walk a directory and return all file entries
pub fn walk_directory(root: &Path, ignore_hidden: bool) -> Result<Vec<FileEntry>> {
    let mut entries = Vec::new();

    for entry in WalkDir::new(root)
        .min_depth(1)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            if ignore_hidden && name.starts_with('.') {
                return false;
            }
            !matches!(name.as_ref(), "node_modules" | "target" | ".git" | "dist" | "__pycache__" | ".next" | "build")
        })
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        let meta = entry.metadata().ok();
        let name = path.file_name().unwrap_or_default().to_string_lossy().to_string();

        let is_dir = entry.file_type().is_dir();
        let size = meta.as_ref().map(|m| m.len()).unwrap_or(0);
        let extension = if !is_dir {
            path.extension().map(|e| e.to_string_lossy().to_string())
        } else {
            None
        };
        let modified = meta.and_then(|m| {
            m.modified().ok().and_then(|t| {
                t.duration_since(std::time::UNIX_EPOCH).ok().map(|d| d.as_secs())
            })
        });

        entries.push(FileEntry {
            name,
            path: path.to_string_lossy().to_string(),
            is_dir,
            size,
            extension,
            modified,
        });
    }

    Ok(entries)
}

/// Get MIME type for a file extension
pub fn get_mime_type(extension: &str) -> &'static str {
    match extension.to_lowercase().as_str() {
        "rs" => "text/x-rust",
        "js" => "application/javascript",
        "ts" | "tsx" => "application/typescript",
        "jsx" => "text/x-jsx",
        "py" => "text/x-python",
        "html" => "text/html",
        "css" | "scss" | "sass" => "text/css",
        "json" => "application/json",
        "toml" => "application/toml",
        "yaml" | "yml" => "application/yaml",
        "md" | "mdx" => "text/markdown",
        "sh" | "bash" => "text/x-shellscript",
        "go" => "text/x-go",
        "java" => "text/x-java",
        "c" | "h" => "text/x-c",
        "cpp" | "cxx" | "cc" | "hpp" => "text/x-c++",
        "svg" => "image/svg+xml",
        "png" | "jpg" | "jpeg" | "gif" | "webp" => "image/*",
        _ => "text/plain",
    }
}

/// Detect the Monaco language identifier for a file extension
pub fn detect_language(extension: &str) -> &'static str {
    match extension.to_lowercase().as_str() {
        "rs" => "rust",
        "js" => "javascript",
        "ts" => "typescript",
        "tsx" => "typescriptreact",
        "jsx" => "javascriptreact",
        "py" => "python",
        "html" | "htm" => "html",
        "css" => "css",
        "scss" => "scss",
        "sass" => "sass",
        "json" | "jsonc" => "json",
        "toml" => "ini",
        "yaml" | "yml" => "yaml",
        "md" | "mdx" => "markdown",
        "sh" | "bash" | "zsh" => "shell",
        "go" => "go",
        "java" => "java",
        "c" | "h" => "c",
        "cpp" | "cxx" | "cc" | "hpp" => "cpp",
        "cs" => "csharp",
        "php" => "php",
        "rb" => "ruby",
        "swift" => "swift",
        "kt" | "kts" => "kotlin",
        "sql" => "sql",
        "xml" => "xml",
        "dockerfile" => "dockerfile",
        "lua" => "lua",
        "r" => "r",
        _ => "plaintext",
    }
}
