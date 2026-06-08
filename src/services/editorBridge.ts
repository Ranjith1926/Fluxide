import type { editor } from "monaco-editor";

/**
 * Module-level handle to the currently mounted Monaco editor so non-editor UI
 * (e.g. the menu bar) can drive editor commands like undo / find / format.
 */
let activeEditor: editor.IStandaloneCodeEditor | null = null;

export function setActiveEditor(instance: editor.IStandaloneCodeEditor | null) {
  activeEditor = instance;
}

export function getActiveEditor() {
  return activeEditor;
}

/** Run a registered Monaco action/command by id against the active editor. */
export function runEditorCommand(commandId: string) {
  const ed = activeEditor;
  if (!ed) return;
  ed.focus();
  ed.trigger("fluxide-menu", commandId, null);
}
