import {
  Folder,
  FolderOpen,
  File,
  FileCode2,
  FileJson,
  FileText,
  FileImage,
  FileType,
  FileLock2,
  FileCog,
  FileArchive,
  FileKey,
  Package,
  GitBranch,
  Hash,
  Database,
  Coffee,
  Terminal,
  Palette,
  BookText,
  LucideIcon,
} from "lucide-react";

interface IconSpec {
  Icon: LucideIcon;
  color: string;
}

// ─── Exact filename matches (highest priority) ────────────────────────────────
const FILENAME_MAP: Record<string, IconSpec> = {
  "package.json": { Icon: Package, color: "#cb3837" },
  "package-lock.json": { Icon: Package, color: "#cb3837" },
  "tsconfig.json": { Icon: FileCog, color: "#3178c6" },
  "tsconfig.node.json": { Icon: FileCog, color: "#3178c6" },
  "vite.config.ts": { Icon: FileCog, color: "#a259ff" },
  "vite.config.js": { Icon: FileCog, color: "#a259ff" },
  "tailwind.config.js": { Icon: FileCog, color: "#38bdf8" },
  "tailwind.config.ts": { Icon: FileCog, color: "#38bdf8" },
  "postcss.config.js": { Icon: FileCog, color: "#dd3a0a" },
  "cargo.toml": { Icon: FileCog, color: "#dea584" },
  "cargo.lock": { Icon: FileLock2, color: "#dea584" },
  "dockerfile": { Icon: FileCog, color: "#2496ed" },
  ".gitignore": { Icon: GitBranch, color: "#f14e32" },
  ".gitattributes": { Icon: GitBranch, color: "#f14e32" },
  "readme.md": { Icon: BookText, color: "#42a5f5" },
  "license": { Icon: FileText, color: "#cbab41" },
  ".env": { Icon: FileKey, color: "#ecd53f" },
  ".env.local": { Icon: FileKey, color: "#ecd53f" },
};

// ─── Extension matches ────────────────────────────────────────────────────────
const EXT_MAP: Record<string, IconSpec> = {
  js: { Icon: FileCode2, color: "#f7df1e" },
  mjs: { Icon: FileCode2, color: "#f7df1e" },
  cjs: { Icon: FileCode2, color: "#f7df1e" },
  ts: { Icon: FileCode2, color: "#3178c6" },
  tsx: { Icon: FileCode2, color: "#61dafb" },
  jsx: { Icon: FileCode2, color: "#61dafb" },
  py: { Icon: FileCode2, color: "#3776ab" },
  rs: { Icon: FileCode2, color: "#dea584" },
  go: { Icon: FileCode2, color: "#00add8" },
  java: { Icon: Coffee, color: "#ea2d2e" },
  kt: { Icon: FileCode2, color: "#a97bff" },
  c: { Icon: FileCode2, color: "#5c9fd6" },
  h: { Icon: FileCode2, color: "#5c9fd6" },
  cpp: { Icon: FileCode2, color: "#5c6bc0" },
  cc: { Icon: FileCode2, color: "#5c6bc0" },
  hpp: { Icon: FileCode2, color: "#5c6bc0" },
  cs: { Icon: FileCode2, color: "#9b4f96" },
  php: { Icon: FileCode2, color: "#777bb4" },
  rb: { Icon: FileCode2, color: "#cc342d" },
  swift: { Icon: FileCode2, color: "#f05138" },
  lua: { Icon: FileCode2, color: "#000080" },
  r: { Icon: FileCode2, color: "#276dc3" },
  vue: { Icon: FileCode2, color: "#41b883" },
  svelte: { Icon: FileCode2, color: "#ff3e00" },

  html: { Icon: FileCode2, color: "#e34c26" },
  htm: { Icon: FileCode2, color: "#e34c26" },
  css: { Icon: Palette, color: "#2965f1" },
  scss: { Icon: Palette, color: "#cf649a" },
  sass: { Icon: Palette, color: "#cf649a" },
  less: { Icon: Palette, color: "#2a4d80" },

  json: { Icon: FileJson, color: "#f5c145" },
  jsonc: { Icon: FileJson, color: "#f5c145" },
  yaml: { Icon: FileCog, color: "#cb4b16" },
  yml: { Icon: FileCog, color: "#cb4b16" },
  toml: { Icon: FileCog, color: "#9c4221" },
  ini: { Icon: FileCog, color: "#6b7280" },
  xml: { Icon: FileCode2, color: "#8bc34a" },

  md: { Icon: FileText, color: "#42a5f5" },
  mdx: { Icon: FileText, color: "#42a5f5" },
  txt: { Icon: FileText, color: "#9aa0a6" },
  pdf: { Icon: FileText, color: "#e53935" },

  sh: { Icon: Terminal, color: "#4eaa25" },
  bash: { Icon: Terminal, color: "#4eaa25" },
  zsh: { Icon: Terminal, color: "#4eaa25" },
  ps1: { Icon: Terminal, color: "#2671be" },
  bat: { Icon: Terminal, color: "#4eaa25" },

  sql: { Icon: Database, color: "#f29111" },
  db: { Icon: Database, color: "#f29111" },

  png: { Icon: FileImage, color: "#26a69a" },
  jpg: { Icon: FileImage, color: "#26a69a" },
  jpeg: { Icon: FileImage, color: "#26a69a" },
  gif: { Icon: FileImage, color: "#26a69a" },
  webp: { Icon: FileImage, color: "#26a69a" },
  bmp: { Icon: FileImage, color: "#26a69a" },
  ico: { Icon: FileImage, color: "#26a69a" },
  svg: { Icon: FileImage, color: "#ffb13b" },

  zip: { Icon: FileArchive, color: "#fbc02d" },
  rar: { Icon: FileArchive, color: "#fbc02d" },
  gz: { Icon: FileArchive, color: "#fbc02d" },
  tar: { Icon: FileArchive, color: "#fbc02d" },
  "7z": { Icon: FileArchive, color: "#fbc02d" },

  lock: { Icon: FileLock2, color: "#6b7280" },
  ttf: { Icon: FileType, color: "#f06292" },
  woff: { Icon: FileType, color: "#f06292" },
  woff2: { Icon: FileType, color: "#f06292" },
  env: { Icon: FileKey, color: "#ecd53f" },
  conf: { Icon: FileCog, color: "#6b7280" },
  config: { Icon: FileCog, color: "#6b7280" },
};

// ─── Folder name colors ───────────────────────────────────────────────────────
const FOLDER_COLOR_MAP: Record<string, string> = {
  node_modules: "#cbcb41",
  src: "#42a5f5",
  dist: "#ab47bc",
  build: "#ab47bc",
  out: "#ab47bc",
  public: "#ef5350",
  assets: "#66bb6a",
  images: "#66bb6a",
  img: "#66bb6a",
  components: "#26c6da",
  hooks: "#ec407a",
  store: "#7e57c2",
  stores: "#7e57c2",
  services: "#29b6f6",
  types: "#26a69a",
  utils: "#8d6e63",
  lib: "#8d6e63",
  config: "#78909c",
  configs: "#78909c",
  pages: "#5c6bc0",
  views: "#5c6bc0",
  api: "#66bb6a",
  styles: "#29b6f6",
  css: "#29b6f6",
  tests: "#fbc02d",
  test: "#fbc02d",
  ".git": "#f4511e",
  ".vscode": "#42a5f5",
  "src-tauri": "#dea584",
  terminal: "#4eaa25",
  editor: "#42a5f5",
  explorer: "#66bb6a",
  ai: "#7e57c2",
  icons: "#ffb13b",
};

const DEFAULT_FOLDER_COLOR = "#90a4ae";
const DEFAULT_FILE: IconSpec = { Icon: File, color: "#9aa0a6" };

function fileIconFor(name: string): IconSpec {
  const lower = name.toLowerCase();
  if (FILENAME_MAP[lower]) return FILENAME_MAP[lower];

  // Multi-part extensions like ".d.ts"
  if (lower.endsWith(".d.ts")) return { Icon: FileCode2, color: "#3178c6" };

  const ext = lower.includes(".") ? lower.split(".").pop()! : "";
  return EXT_MAP[ext] ?? DEFAULT_FILE;
}

function folderColor(name: string): string {
  return FOLDER_COLOR_MAP[name.toLowerCase()] ?? DEFAULT_FOLDER_COLOR;
}

interface FileIconViewProps {
  name: string;
  isDir?: boolean;
  isOpen?: boolean;
  size?: number;
}

/** Material-theme-style colored icon for a file or folder. */
export function FileIconView({ name, isDir, isOpen, size = 16 }: FileIconViewProps) {
  if (isDir) {
    const color = folderColor(name);
    const Icon = isOpen ? FolderOpen : Folder;
    return (
      <Icon
        size={size}
        style={{ color }}
        fill={color}
        fillOpacity={0.22}
        strokeWidth={1.75}
      />
    );
  }

  const { Icon, color } = fileIconFor(name);
  return <Icon size={size} style={{ color }} strokeWidth={1.75} />;
}
