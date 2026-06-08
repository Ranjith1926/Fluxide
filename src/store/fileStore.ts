import { create } from "zustand";
import { FileNode } from "@/types";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

interface FileState {
  workspacePath: string | null;
  fileTree: FileNode[];
  expandedPaths: Set<string>;
  selectedPath: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  openFolder: () => Promise<void>;
  openFolderPath: (path: string) => Promise<void>;
  refreshDirectory: (path?: string) => Promise<void>;
  expandPath: (path: string) => void;
  collapsePath: (path: string) => void;
  togglePath: (path: string) => void;
  setSelectedPath: (path: string | null) => void;
  createFile: (parentPath: string, name: string) => Promise<void>;
  createDirectory: (parentPath: string, name: string) => Promise<void>;
  deleteNode: (path: string, isDir: boolean) => Promise<void>;
  renameNode: (oldPath: string, newPath: string) => Promise<void>;
}

export const useFileStore = create<FileState>((set, get) => ({
  workspacePath: null,
  fileTree: [],
  expandedPaths: new Set(),
  selectedPath: null,
  isLoading: false,
  error: null,

  openFolder: async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Open Folder",
    });

    if (selected && typeof selected === "string") {
      await get().openFolderPath(selected);
    }
  },

  openFolderPath: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      const tree = await invoke<FileNode[]>("open_folder", { path });
      set({
        workspacePath: path,
        fileTree: tree,
        isLoading: false,
        expandedPaths: new Set([path]),
      });

      // Index workspace
      invoke("index_workspace", { path }).catch(console.warn);
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  refreshDirectory: async (path?: string) => {
    const { workspacePath } = get();
    const targetPath = path ?? workspacePath;
    if (!targetPath) return;

    try {
      if (!path || path === workspacePath) {
        const tree = await invoke<FileNode[]>("open_folder", { path: targetPath });
        set({ fileTree: tree });
      } else {
        const children = await invoke<FileNode[]>("list_directory", { path: targetPath });
        set((state) => ({
          fileTree: updateNodeChildren(state.fileTree, targetPath, children),
        }));
      }
    } catch (error) {
      console.error("Failed to refresh directory:", error);
    }
  },

  expandPath: (path: string) => {
    set((state) => ({
      expandedPaths: new Set([...state.expandedPaths, path]),
    }));
  },

  collapsePath: (path: string) => {
    set((state) => {
      const next = new Set(state.expandedPaths);
      next.delete(path);
      return { expandedPaths: next };
    });
  },

  togglePath: (path: string) => {
    const { expandedPaths, expandPath, collapsePath } = get();
    if (expandedPaths.has(path)) {
      collapsePath(path);
    } else {
      expandPath(path);
    }
  },

  setSelectedPath: (path: string | null) => {
    set({ selectedPath: path });
  },

  createFile: async (parentPath: string, name: string) => {
    const newPath = `${parentPath}/${name}`;
    await invoke("create_file", { path: newPath });
    await get().refreshDirectory(parentPath);
  },

  createDirectory: async (parentPath: string, name: string) => {
    const newPath = `${parentPath}/${name}`;
    await invoke("create_directory", { path: newPath });
    await get().refreshDirectory(parentPath);
  },

  deleteNode: async (path: string, isDir: boolean) => {
    await invoke("delete_file", { path, isDir });
    const parent = path.substring(0, path.lastIndexOf("/"));
    await get().refreshDirectory(parent || get().workspacePath || "");
  },

  renameNode: async (oldPath: string, newPath: string) => {
    await invoke("rename_file", { oldPath, newPath });
    const parent = oldPath.substring(0, oldPath.lastIndexOf("/"));
    await get().refreshDirectory(parent || get().workspacePath || "");
  },
}));

function updateNodeChildren(
  nodes: FileNode[],
  targetPath: string,
  children: FileNode[]
): FileNode[] {
  return nodes.map((node) => {
    if (node.path === targetPath) {
      return { ...node, children };
    }
    if (node.children) {
      return {
        ...node,
        children: updateNodeChildren(node.children, targetPath, children),
      };
    }
    return node;
  });
}
