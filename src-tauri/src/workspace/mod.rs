use anyhow::Result;
use serde::Serialize;
use std::path::PathBuf;
use walkdir::WalkDir;

// ─── Public types (used by commands/workspace.rs) ─────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct WorkspaceInfo {
    pub root: String,
    pub file_count: usize,
    pub indexed: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct SearchResult {
    pub path: String,
    pub line: usize,
    pub content: String,
    pub matches: Vec<(usize, usize)>,
}

// ─── Manager ─────────────────────────────────────────────────────────────────

pub struct WorkspaceManager {
    root: Option<PathBuf>,
    indexed_files: Vec<PathBuf>,
}

impl WorkspaceManager {
    pub fn new() -> Self {
        Self { root: None, indexed_files: Vec::new() }
    }

    pub fn get_info(&self) -> Option<WorkspaceInfo> {
        self.root.as_ref().map(|r| WorkspaceInfo {
            root: r.to_string_lossy().to_string(),
            file_count: self.indexed_files.len(),
            indexed: !self.indexed_files.is_empty(),
        })
    }

    pub fn index(&mut self, path: &str) -> Result<()> {
        let root = PathBuf::from(path);
        self.root = Some(root.clone());
        self.indexed_files.clear();

        for entry in WalkDir::new(&root)
            .into_iter()
            .filter_entry(|e| {
                let name = e.file_name().to_string_lossy();
                !name.starts_with('.')
                    && !matches!(
                        name.as_ref(),
                        "node_modules" | "target" | ".git" | "dist" | "__pycache__" | ".next"
                    )
            })
            .filter_map(|e| e.ok())
            .filter(|e| !e.file_type().is_dir())
        {
            let ext = entry.path().extension().and_then(|e| e.to_str()).unwrap_or("");
            if is_text_extension(ext) {
                self.indexed_files.push(entry.into_path());
            }
        }

        log::info!("Workspace indexed: {} files in {:?}", self.indexed_files.len(), root);
        Ok(())
    }

    pub fn search(&self, query: &str, file_pattern: Option<&str>) -> Result<Vec<SearchResult>> {
        let mut results = Vec::new();
        let query_lower = query.to_lowercase();

        for file_path in &self.indexed_files {
            if let Some(pattern) = file_pattern {
                let name = file_path.file_name().unwrap_or_default().to_string_lossy();
                if !glob_match(pattern, &name) {
                    continue;
                }
            }

            let content = match std::fs::read_to_string(file_path) {
                Ok(c) => c,
                Err(_) => continue,
            };

            for (line_num, line) in content.lines().enumerate() {
                let line_lower = line.to_lowercase();
                if line_lower.contains(&query_lower) {
                    let mut matches = Vec::new();
                    let mut start = 0;
                    while let Some(pos) = line_lower[start..].find(&query_lower) {
                        let abs = start + pos;
                        matches.push((abs, abs + query.len()));
                        start = abs + 1;
                    }
                    results.push(SearchResult {
                        path: file_path.to_string_lossy().to_string(),
                        line: line_num + 1,
                        content: line.trim().to_string(),
                        matches,
                    });
                    if results.len() >= 500 {
                        return Ok(results);
                    }
                }
            }
        }

        Ok(results)
    }
}

fn is_text_extension(ext: &str) -> bool {
    matches!(
        ext.to_lowercase().as_str(),
        "rs" | "js" | "ts" | "tsx" | "jsx" | "py" | "go" | "java" | "c" | "cpp" | "h"
            | "hpp" | "cs" | "rb" | "php" | "swift" | "kt" | "html" | "css" | "scss"
            | "json" | "toml" | "yaml" | "yml" | "md" | "txt" | "sh" | "bash" | "xml"
            | "sql" | "graphql" | "vue" | "svelte" | "lua" | "r" | "env"
    )
}

fn glob_match(pattern: &str, name: &str) -> bool {
    if let Some(ext) = pattern.strip_prefix("*.") {
        name.ends_with(&format!(".{}", ext))
    } else {
        name.contains(pattern)
    }
}
