/** Generate a short unique ID */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

const LANGUAGE_MAP: Record<string, string> = {
  rs: "rust",
  js: "javascript",
  ts: "typescript",
  tsx: "typescriptreact",
  jsx: "javascriptreact",
  py: "python",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  sass: "sass",
  json: "json",
  jsonc: "json",
  toml: "ini",
  yaml: "yaml",
  yml: "yaml",
  md: "markdown",
  mdx: "markdown",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  go: "go",
  java: "java",
  c: "c",
  h: "c",
  cpp: "cpp",
  cxx: "cpp",
  cc: "cpp",
  hpp: "cpp",
  cs: "csharp",
  php: "php",
  rb: "ruby",
  swift: "swift",
  kt: "kotlin",
  kts: "kotlin",
  sql: "sql",
  xml: "xml",
  lua: "lua",
  r: "r",
  dockerfile: "dockerfile",
  vue: "html",
  svelte: "html",
  graphql: "graphql",
  gql: "graphql",
};

export function detectLanguage(extension: string): string {
  return LANGUAGE_MAP[extension.toLowerCase()] ?? "plaintext";
}

const FILE_ICON_MAP: Record<string, string> = {
  rs: "🦀",
  js: "🟨",
  ts: "🔷",
  tsx: "⚛️",
  jsx: "⚛️",
  py: "🐍",
  html: "🌐",
  css: "🎨",
  scss: "🎨",
  json: "📋",
  toml: "⚙️",
  yaml: "⚙️",
  yml: "⚙️",
  md: "📝",
  sh: "💻",
  go: "🐹",
  java: "☕",
  c: "🔧",
  cpp: "🔧",
  cs: "🔷",
  php: "🐘",
  rb: "💎",
  swift: "🍎",
  kt: "🟣",
  sql: "🗄️",
  dockerfile: "🐳",
  svg: "🖼️",
  png: "🖼️",
  jpg: "🖼️",
  gif: "🖼️",
};

export function getFileIcon(filename: string, isDir: boolean): string {
  if (isDir) return "📁";
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return FILE_ICON_MAP[ext] ?? "📄";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function getFileName(path: string): string {
  return path.split(/[/\\]/).pop() ?? path;
}

export function getParentDir(path: string): string {
  const parts = path.split(/[/\\]/);
  parts.pop();
  return parts.join("/");
}

export function joinPath(...parts: string[]): string {
  return parts.join("/").replace(/\/+/g, "/");
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}
