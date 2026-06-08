import { invoke } from "@tauri-apps/api/core";
import { FileNode } from "@/types";

export async function readFile(path: string): Promise<string> {
  return invoke<string>("read_file", { path });
}

export async function writeFile(path: string, content: string): Promise<void> {
  return invoke<void>("write_file", { path, content });
}

export async function openFolder(path?: string): Promise<FileNode[]> {
  if (path) {
    return invoke<FileNode[]>("open_folder", { path });
  }
  throw new Error("No path provided");
}

export async function listDirectory(path: string): Promise<FileNode[]> {
  return invoke<FileNode[]>("list_directory", { path });
}

export async function createFile(path: string): Promise<void> {
  return invoke<void>("create_file", { path });
}

export async function createDirectory(path: string): Promise<void> {
  return invoke<void>("create_directory", { path });
}

export async function deleteFile(path: string, isDir: boolean): Promise<void> {
  return invoke<void>("delete_file", { path, isDir });
}

export async function renameFile(oldPath: string, newPath: string): Promise<void> {
  return invoke<void>("rename_file", { oldPath, newPath });
}

export async function fileExists(path: string): Promise<boolean> {
  return invoke<boolean>("file_exists", { path });
}
