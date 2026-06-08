import { useState } from "react";
import {
  FolderOpen,
  RefreshCw,
  FilePlus,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useFileStore } from "@/store/fileStore";
import { useEditorStore } from "@/store/editorStore";
import { FileNode } from "@/types";
import { cn } from "@/services/utils";
import { FileIconView } from "@/services/fileIcons";

export function FileExplorer() {
  const { fileTree, workspacePath, isLoading, openFolder, refreshDirectory } =
    useFileStore();

  const workspaceName = workspacePath?.split(/[/\\]/).pop() ?? "";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-flux-border shrink-0">
        <span className="text-2xs font-semibold uppercase tracking-wider text-flux-muted">
          {workspaceName || "Explorer"}
        </span>
        <div className="flex items-center gap-1">
          <IconButton
            icon={<RefreshCw size={13} />}
            title="Refresh"
            onClick={() => refreshDirectory()}
          />
          <IconButton
            icon={<FolderOpen size={13} />}
            title="Open Folder"
            onClick={openFolder}
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="animate-spin text-flux-muted" />
          </div>
        ) : fileTree.length === 0 ? (
          <EmptyState onOpenFolder={openFolder} />
        ) : (
          <FileTree nodes={fileTree} depth={0} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ onOpenFolder }: { onOpenFolder: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 gap-3">
      <FolderOpen size={32} className="text-flux-muted/50" />
      <p className="text-xs text-flux-muted text-center">
        No folder open
      </p>
      <button
        onClick={onOpenFolder}
        className="px-3 py-1.5 text-xs bg-flux-accent/20 hover:bg-flux-accent/30 text-flux-accent border border-flux-accent/30 rounded-md transition-colors"
      >
        Open Folder
      </button>
    </div>
  );
}

interface FileTreeProps {
  nodes: FileNode[];
  depth: number;
}

function FileTree({ nodes, depth }: FileTreeProps) {
  return (
    <div>
      {nodes.map((node) => (
        <FileItem key={node.path} node={node} depth={depth} />
      ))}
    </div>
  );
}

interface FileItemProps {
  node: FileNode;
  depth: number;
}

function FileItem({ node, depth }: FileItemProps) {
  const { expandedPaths, selectedPath, togglePath, setSelectedPath, refreshDirectory } =
    useFileStore();
  const { openFile, isTabOpen } = useEditorStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);

  const isExpanded = expandedPaths.has(node.path);
  const isSelected = selectedPath === node.path;
  const isOpen = !node.is_dir && isTabOpen(node.path);

  const handleClick = async () => {
    setSelectedPath(node.path);

    if (node.is_dir) {
      togglePath(node.path);
      if (!isExpanded && (!node.children || node.children.length === 0)) {
        await refreshDirectory(node.path);
      }
    } else {
      try {
        await openFile(node.path, node.name);
      } catch (e) {
        console.error("Failed to open file:", e);
      }
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        className={cn(
          "flex items-center gap-1.5 py-0.5 pr-2 cursor-pointer group select-none text-xs",
          "transition-colors duration-75",
          isSelected
            ? "bg-flux-accent/20 text-flux-text"
            : "text-flux-muted hover:text-flux-text hover:bg-flux-surface"
        )}
      >
        {/* Chevron for dirs */}
        <span className="w-3 shrink-0">
          {node.is_dir && (
            isExpanded
              ? <ChevronDown size={12} className="text-flux-muted" />
              : <ChevronRight size={12} className="text-flux-muted" />
          )}
        </span>

        <span className="flex items-center shrink-0">
          <FileIconView
            name={node.name}
            isDir={node.is_dir}
            isOpen={isExpanded}
            size={15}
          />
        </span>

        <span className={cn(
          "truncate flex-1",
          isOpen && "text-flux-accent"
        )}>
          {node.name}
        </span>
      </div>

      {/* Children */}
      {node.is_dir && isExpanded && node.children && (
        <FileTree nodes={node.children} depth={depth + 1} />
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          node={node}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

interface ContextMenuProps {
  node: FileNode;
  position: { x: number; y: number };
  onClose: () => void;
}

function ContextMenu({ node, position, onClose }: ContextMenuProps) {
  const { createFile, createDirectory, deleteNode, renameNode, refreshDirectory } =
    useFileStore();

  const items = node.is_dir
    ? [
        {
          label: "New File",
          action: async () => {
            const name = window.prompt("File name:");
            if (name) {
              await createFile(node.path, name);
            }
          },
        },
        {
          label: "New Folder",
          action: async () => {
            const name = window.prompt("Folder name:");
            if (name) {
              await createDirectory(node.path, name);
            }
          },
        },
        { label: "separator" },
        {
          label: "Refresh",
          action: () => refreshDirectory(node.path),
        },
        { label: "separator" },
        {
          label: "Delete Folder",
          danger: true,
          action: async () => {
            if (window.confirm(`Delete folder "${node.name}" and all its contents?`)) {
              await deleteNode(node.path, true);
            }
          },
        },
      ]
    : [
        {
          label: "Rename",
          action: async () => {
            const name = window.prompt("New name:", node.name);
            if (name && name !== node.name) {
              const parent = node.path.substring(0, node.path.lastIndexOf("/"));
              await renameNode(node.path, `${parent}/${name}`);
            }
          },
        },
        { label: "separator" },
        {
          label: "Delete File",
          danger: true,
          action: async () => {
            if (window.confirm(`Delete "${node.name}"?`)) {
              await deleteNode(node.path, false);
            }
          },
        },
      ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        style={{ top: position.y, left: position.x }}
        className="fixed z-50 bg-flux-panel border border-flux-border rounded-lg shadow-lg py-1 min-w-36 animate-fade-in"
      >
        {items.map((item, i) =>
          item.label === "separator" ? (
            <div key={i} className="border-t border-flux-border my-1" />
          ) : (
            <button
              key={item.label}
              onClick={async () => {
                onClose();
                await item.action!();
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs transition-colors",
                item.danger
                  ? "text-flux-error hover:bg-flux-error/10"
                  : "text-flux-text hover:bg-flux-surface"
              )}
            >
              {item.label}
            </button>
          )
        )}
      </div>
    </>
  );
}

interface IconButtonProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}

function IconButton({ icon, title, onClick }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1 rounded text-flux-muted hover:text-flux-text hover:bg-flux-surface transition-colors"
    >
      {icon}
    </button>
  );
}
