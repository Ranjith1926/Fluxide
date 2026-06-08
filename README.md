# FluxIDE

**Offline AI Coding. Supercharged.**

FluxIDE is a production-grade, offline-first AI IDE built with Tauri, Rust, React, Monaco Editor, xterm.js, and llama.cpp. It runs your AI model completely locally — no API keys, no cloud, no limits.

---

## Features

- **Monaco Editor** — VS Code's editor with full IntelliSense, 20+ language support, themes, minimap
- **Embedded AI Runtime** — Local llama.cpp inference via llama-server subprocess
- **AI Chat Panel** — Streaming chat with markdown + syntax-highlighted code blocks
- **AI Code Actions** — Explain, fix, refactor, generate with context-aware prompts
- **File Explorer** — Recursive file tree, create/delete/rename, workspace management
- **Integrated Terminal** — xterm.js + portable-pty with full PTY support
- **Workspace Search** — Fast full-text search across all project files
- **Model Manager** — Download Qwen2.5-Coder, DeepSeek-Coder, Phi-3 with progress
- **Resizable Layout** — VS Code–style panels with drag handles
- **Keyboard Shortcuts** — Ctrl+S, Ctrl+`, Ctrl+B, Ctrl+Shift+A, and more

---

## Architecture

```
Frontend (React + Vite)
        ↓
Tauri IPC Bridge (invoke / Channel / listen)
        ↓
Rust Backend (Tokio async)
        ↓
AI Runtime Manager
        ↓
llama-server subprocess (HTTP :8765)
        ↓
GGUF Model (Qwen2.5-Coder / DeepSeek / Phi-3)
```

---

## Prerequisites

### Required

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | https://nodejs.org |
| Rust | ≥ 1.77 | https://rustup.rs |
| Tauri CLI | 2.x | `npm install -g @tauri-apps/cli` |

### Platform-specific

**Windows:**
- Microsoft Visual Studio C++ Build Tools
- WebView2 Runtime (usually pre-installed on Windows 11)

**macOS:**
- Xcode Command Line Tools: `xcode-select --install`

**Linux:**
- `sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`

---

## Getting Started

### 1. Clone & install

```bash
cd fluxide
npm install
```

### 2. Install llama.cpp (required for AI features)

**Option A — Homebrew (macOS):**
```bash
brew install llama.cpp
```

**Option B — Build from source:**
```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
cmake -B build
cmake --build build --config Release -j
# Copy the llama-server binary to your PATH or to fluxide's bin dir
```

**Option C — Pre-built binary:**
Download from https://github.com/ggerganov/llama.cpp/releases and place `llama-server` (or `llama-server.exe`) in:
- `~/.local/share/com.fluxide.app/bin/` (Linux)
- `~/Library/Application Support/com.fluxide.app/bin/` (macOS)
- `%APPDATA%\com.fluxide.app\bin\` (Windows)

### 3. Run in development

```bash
npm run tauri dev
```

### 4. Build for production

```bash
npm run tauri build
```

Outputs to `src-tauri/target/release/bundle/`.

---

## AI Model Setup

On first launch, FluxIDE will show the **Model Downloader** panel. Select a model:

| Model | Size | Best For |
|-------|------|----------|
| Qwen2.5-Coder 1.5B ⭐ | 1.0 GB | Fast inference, good quality |
| Qwen2.5-Coder 7B | 4.7 GB | Best quality, needs 8GB RAM |
| DeepSeek-Coder 1.3B | 0.8 GB | Ultra-fast, low RAM |
| Phi-3 Mini 3.8B | 2.2 GB | Balanced reasoning |

FluxIDE downloads the model to your app data directory and auto-starts the AI engine.

### Manual model setup

1. Download any `.gguf` file compatible with llama.cpp
2. Place it in the models directory:
   - macOS: `~/Library/Application Support/com.fluxide.app/models/`
   - Linux: `~/.local/share/com.fluxide.app/models/`
   - Windows: `%APPDATA%\com.fluxide.app\models\`
3. Click **Start AI Engine** in FluxIDE

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save current file |
| `Ctrl+Shift+S` | Save all files |
| `Ctrl+W` | Close current tab |
| `Ctrl+` `` ` `` | Toggle terminal |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+Shift+A` | Toggle AI panel |
| `Ctrl+Shift+E` | Explain selected code |
| `Ctrl+Shift+F` | Fix/improve selected code |

---

## Project Structure

```
fluxide/
├── src/                        # React frontend
│   ├── components/
│   │   ├── ai/                 # ChatPanel, ChatMessage, ModelDownloader
│   │   ├── editor/             # MonacoEditor, TabBar, EditorPanel
│   │   ├── explorer/           # FileExplorer, SearchPanel
│   │   ├── layout/             # ActivityBar, StatusBar, TitleBar
│   │   └── terminal/           # Terminal (xterm.js), TerminalPanel
│   ├── hooks/                  # useKeyboardShortcuts, useEventListeners
│   ├── services/               # filesystem, utils, prompts
│   ├── store/                  # Zustand stores (editor, file, ai, terminal, ui)
│   ├── types/                  # TypeScript type definitions
│   ├── App.tsx                 # Root layout with resizable panels
│   └── main.tsx                # React entry point
│
└── src-tauri/                  # Rust backend
    ├── src/
    │   ├── ai/
    │   │   ├── manager.rs      # AI lifecycle (start/stop/download)
    │   │   ├── inference.rs    # HTTP streaming to llama-server
    │   │   ├── models.rs       # Model catalog + metadata
    │   │   ├── prompts.rs      # System prompts
    │   │   └── streaming.rs    # Cancellation token
    │   ├── commands/           # Tauri IPC command handlers
    │   ├── filesystem/         # File operations + language detection
    │   ├── terminal/           # PTY session management
    │   ├── workspace/          # File indexing + search
    │   ├── lib.rs              # App setup + state
    │   └── main.rs             # Entry point
    ├── Cargo.toml
    └── tauri.conf.json
```

---

## Development Tips

### Hot reload
Vite provides instant HMR for the frontend. Rust changes require recompilation (a few seconds).

### Debugging AI
The llama-server logs are printed to stdout. In dev mode, you'll see them in the terminal.

### Adding a new language
Edit `src/services/utils.ts` → `LANGUAGE_MAP` and `src-tauri/src/filesystem/mod.rs` → `detect_language`.

### Adding a new AI model
Edit `src-tauri/src/ai/models.rs` → `get_available_models()` with the HuggingFace GGUF URL.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop runtime | Tauri 2.x |
| Backend language | Rust (Tokio async) |
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| State management | Zustand 4 |
| Code editor | Monaco Editor |
| Terminal emulator | xterm.js 5 |
| PTY | portable-pty |
| AI runtime | llama.cpp (llama-server) |
| HTTP client | reqwest |
| File watching | notify |
| Directory walking | walkdir |

---

## License

MIT — Build something amazing.
