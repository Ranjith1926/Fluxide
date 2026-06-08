import { useMemo, useState } from "react";
import {
  Search,
  Map,
  WrapText,
  Braces,
  TextCursor,
  Bot,
  TerminalSquare,
  Code2,
  Check,
  LucideIcon,
} from "lucide-react";
import { useExtensionsStore } from "@/store/extensionsStore";
import { cn } from "@/services/utils";

interface Extension {
  id: string;
  name: string;
  publisher: string;
  description: string;
  category: "Editor" | "AI" | "Tools" | "Languages";
  icon: LucideIcon;
  builtin?: boolean;
}

const EXTENSIONS: Extension[] = [
  {
    id: "minimap",
    name: "Code Minimap",
    publisher: "FluxIDE",
    description: "Show the source overview minimap on the right edge of the editor.",
    category: "Editor",
    icon: Map,
  },
  {
    id: "word-wrap",
    name: "Word Wrap",
    publisher: "FluxIDE",
    description: "Wrap long lines to the editor width instead of scrolling horizontally.",
    category: "Editor",
    icon: WrapText,
  },
  {
    id: "bracket-colorization",
    name: "Bracket Pair Colorizer",
    publisher: "FluxIDE",
    description: "Colorize matching brackets so nested code is easier to read.",
    category: "Editor",
    icon: Braces,
  },
  {
    id: "smooth-cursor",
    name: "Smooth Cursor",
    publisher: "FluxIDE",
    description: "Animate cursor movement and enable smooth scrolling.",
    category: "Editor",
    icon: TextCursor,
  },
  {
    id: "ai-assistant",
    name: "AI Assistant",
    publisher: "FluxIDE",
    description: "Local LLM chat to write, explain and fix code — runs fully offline.",
    category: "AI",
    icon: Bot,
    builtin: true,
  },
  {
    id: "terminal",
    name: "Integrated Terminal",
    publisher: "FluxIDE",
    description: "Built-in PTY terminal with multiple concurrent sessions.",
    category: "Tools",
    icon: TerminalSquare,
    builtin: true,
  },
  {
    id: "syntax",
    name: "Syntax Highlighting",
    publisher: "FluxIDE",
    description: "Language grammars and IntelliSense powered by Monaco.",
    category: "Languages",
    icon: Code2,
    builtin: true,
  },
];

export function ExtensionsPanel() {
  const [query, setQuery] = useState("");
  const { enabled, toggle } = useExtensionsStore();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EXTENSIONS;
    return EXTENSIONS.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wide text-flux-muted">
          Extensions
        </span>
      </div>

      {/* Search */}
      <div className="px-2 pb-2 shrink-0">
        <div className="flex items-center gap-2 px-2 py-1.5 bg-flux-surface border border-flux-border rounded-md focus-within:border-flux-accent transition-colors">
          <Search size={13} className="text-flux-muted shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search extensions"
            className="flex-1 bg-transparent text-xs text-flux-text placeholder:text-flux-muted outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {filtered.length === 0 ? (
          <p className="text-2xs text-flux-muted text-center py-6">No extensions found</p>
        ) : (
          filtered.map((ext) => (
            <ExtensionCard
              key={ext.id}
              ext={ext}
              enabled={enabled[ext.id] ?? false}
              onToggle={() => toggle(ext.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ExtensionCard({
  ext,
  enabled,
  onToggle,
}: {
  ext: Extension;
  enabled: boolean;
  onToggle: () => void;
}) {
  const Icon = ext.icon;
  return (
    <div className="flex gap-2.5 p-2 rounded-lg hover:bg-flux-surface transition-colors group">
      <div className="w-8 h-8 rounded-md bg-flux-accent/15 border border-flux-accent/25 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-flux-accent" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-flux-text truncate">{ext.name}</span>
          {ext.builtin && (
            <span className="px-1 py-0.5 text-[9px] leading-none rounded bg-flux-border text-flux-muted shrink-0">
              Built-in
            </span>
          )}
        </div>
        <p className="text-2xs text-flux-muted line-clamp-2 mt-0.5">{ext.description}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-2xs text-flux-muted">{ext.publisher}</span>
          <button
            onClick={onToggle}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 text-2xs rounded border transition-colors",
              enabled
                ? "bg-flux-success/15 text-flux-success border-flux-success/30"
                : "bg-flux-accent/15 text-flux-accent border-flux-accent/30 hover:bg-flux-accent/25"
            )}
          >
            {enabled ? (
              <>
                <Check size={10} />
                Enabled
              </>
            ) : (
              "Enable"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
