import { useState, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { SearchResult } from "@/types";
import { useEditorStore } from "@/store/editorStore";
import { debounce, getFileName } from "@/services/utils";

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { openFile } = useEditorStore();

  const performSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const res = await invoke<SearchResult[]>("search_workspace", {
          query: q,
          filePattern: null,
        });
        setResults(res);
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setIsSearching(false);
      }
    }, 400),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    performSearch(e.target.value);
  };

  const grouped = groupByFile(results);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-flux-border">
        <span className="text-2xs font-semibold uppercase tracking-wider text-flux-muted">
          Search
        </span>
      </div>

      <div className="px-3 py-2 border-b border-flux-border">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-flux-muted" />
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Search in workspace…"
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-flux-surface border border-flux-border rounded text-flux-text placeholder:text-flux-muted outline-none focus:border-flux-accent transition-colors"
          />
          {isSearching && (
            <Loader2
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-flux-muted animate-spin"
            />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {results.length === 0 && query && !isSearching && (
          <div className="text-center py-8 text-xs text-flux-muted">
            No results found for "{query}"
          </div>
        )}

        {Object.entries(grouped).map(([filePath, fileResults]) => (
          <div key={filePath} className="mb-1">
            <div className="px-3 py-1 text-2xs text-flux-muted font-medium truncate sticky top-0 bg-flux-bg">
              {getFileName(filePath)}
            </div>
            {fileResults.map((result, i) => (
              <div
                key={i}
                onClick={() => openFile(filePath, getFileName(filePath))}
                className="px-3 py-1 hover:bg-flux-surface cursor-pointer group"
              >
                <span className="text-2xs text-flux-muted font-mono mr-2">
                  {result.line}
                </span>
                <span className="text-xs text-flux-text font-mono">
                  {result.content.substring(0, 80)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function groupByFile(results: SearchResult[]): Record<string, SearchResult[]> {
  return results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.path]) acc[r.path] = [];
    acc[r.path].push(r);
    return acc;
  }, {});
}
