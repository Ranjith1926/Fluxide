import { ReactNode, useRef, useState } from "react";
import {
  FilePlus,
  FolderOpen,
  Save,
  SaveAll,
  X,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  ClipboardPaste,
  Search,
  Replace,
  TextCursorInput,
  PanelLeft,
  PanelBottom,
  Bot,
  Files,
  SunMedium,
  Moon,
  TerminalSquare,
  Play,
  ArrowRightToLine,
  Code2,
  Info,
  Power,
} from "lucide-react";
import { MenuPanel, MenuItem, MenuSeparator, MenuLabel } from "@/components/common/MenuPanel";
import { useEditorStore } from "@/store/editorStore";
import { useFileStore } from "@/store/fileStore";
import { useUIStore } from "@/store/uiStore";
import { useTerminalStore } from "@/store/terminalStore";
import { runEditorCommand } from "@/services/editorBridge";
import { cn } from "@/services/utils";

type MenuId = "file" | "edit" | "selection" | "view" | "go" | "run" | "terminal" | "help";

export function MenuBar() {
  const [open, setOpen] = useState<MenuId | null>(null);
  const anchors = useRef<Record<string, HTMLButtonElement | null>>({});

  const editor = useEditorStore();
  const files = useFileStore();
  const ui = useUIStore();
  const terminal = useTerminalStore();

  const close = () => setOpen(null);
  const run = (fn: () => void) => () => {
    fn();
    close();
  };

  const menus: { id: MenuId; label: string; render: () => ReactNode }[] = [
    {
      id: "file",
      label: "File",
      render: () => (
        <>
          <MenuItem icon={<FilePlus size={13} />} label="New File" shortcut="Ctrl+N" onClick={run(editor.openNewFile)} />
          <MenuItem icon={<TerminalSquare size={13} />} label="New Terminal" shortcut="Ctrl+Shift+`" onClick={run(() => { terminal.createSession().catch(console.error); ui.terminalVisible || ui.toggleTerminal(); })} />
          <MenuSeparator />
          <MenuItem icon={<FolderOpen size={13} />} label="Open Folder…" shortcut="Ctrl+K Ctrl+O" onClick={run(() => files.openFolder().catch(console.error))} />
          <MenuSeparator />
          <MenuItem icon={<Save size={13} />} label="Save" shortcut="Ctrl+S" disabled={!editor.activeTabId} onClick={run(() => editor.saveFile().catch(console.error))} />
          <MenuItem icon={<SaveAll size={13} />} label="Save All" shortcut="Ctrl+Shift+S" disabled={editor.tabs.length === 0} onClick={run(() => editor.saveAllFiles().catch(console.error))} />
          <MenuSeparator />
          <MenuItem icon={<X size={13} />} label="Close Editor" shortcut="Ctrl+W" disabled={!editor.activeTabId} onClick={run(() => editor.activeTabId && editor.closeTab(editor.activeTabId))} />
          <MenuSeparator />
          <MenuItem icon={<Power size={13} />} label="Exit" onClick={run(closeWindow)} />
        </>
      ),
    },
    {
      id: "edit",
      label: "Edit",
      render: () => (
        <>
          <MenuItem icon={<Undo2 size={13} />} label="Undo" shortcut="Ctrl+Z" onClick={run(() => runEditorCommand("undo"))} />
          <MenuItem icon={<Redo2 size={13} />} label="Redo" shortcut="Ctrl+Y" onClick={run(() => runEditorCommand("redo"))} />
          <MenuSeparator />
          <MenuItem icon={<Scissors size={13} />} label="Cut" shortcut="Ctrl+X" onClick={run(() => runEditorCommand("editor.action.clipboardCutAction"))} />
          <MenuItem icon={<Copy size={13} />} label="Copy" shortcut="Ctrl+C" onClick={run(() => runEditorCommand("editor.action.clipboardCopyAction"))} />
          <MenuItem icon={<ClipboardPaste size={13} />} label="Paste" shortcut="Ctrl+V" onClick={run(() => runEditorCommand("editor.action.clipboardPasteAction"))} />
          <MenuSeparator />
          <MenuItem icon={<Search size={13} />} label="Find" shortcut="Ctrl+F" onClick={run(() => runEditorCommand("actions.find"))} />
          <MenuItem icon={<Replace size={13} />} label="Replace" shortcut="Ctrl+H" onClick={run(() => runEditorCommand("editor.action.startFindReplaceAction"))} />
        </>
      ),
    },
    {
      id: "selection",
      label: "Selection",
      render: () => (
        <>
          <MenuItem icon={<TextCursorInput size={13} />} label="Select All" shortcut="Ctrl+A" onClick={run(() => runEditorCommand("editor.action.selectAll"))} />
          <MenuItem label="Copy Line Up" onClick={run(() => runEditorCommand("editor.action.copyLinesUpAction"))} />
          <MenuItem label="Copy Line Down" onClick={run(() => runEditorCommand("editor.action.copyLinesDownAction"))} />
          <MenuItem label="Move Line Up" shortcut="Alt+↑" onClick={run(() => runEditorCommand("editor.action.moveLinesUpAction"))} />
          <MenuItem label="Move Line Down" shortcut="Alt+↓" onClick={run(() => runEditorCommand("editor.action.moveLinesDownAction"))} />
          <MenuSeparator />
          <MenuItem label="Toggle Line Comment" shortcut="Ctrl+/" onClick={run(() => runEditorCommand("editor.action.commentLine"))} />
          <MenuItem label="Add Cursor Below" shortcut="Ctrl+Alt+↓" onClick={run(() => runEditorCommand("editor.action.insertCursorBelow"))} />
        </>
      ),
    },
    {
      id: "view",
      label: "View",
      render: () => (
        <>
          <MenuItem icon={<PanelLeft size={13} />} label="Toggle Sidebar" shortcut="Ctrl+B" active={ui.sidebarVisible} onClick={run(ui.toggleSidebar)} />
          <MenuItem icon={<PanelBottom size={13} />} label="Toggle Terminal" shortcut="Ctrl+`" active={ui.terminalVisible} onClick={run(ui.toggleTerminal)} />
          <MenuItem icon={<Bot size={13} />} label="Toggle AI Panel" shortcut="Ctrl+Shift+A" active={ui.aiPanelVisible} onClick={run(ui.toggleAIPanel)} />
          <MenuSeparator />
          <MenuItem icon={<Files size={13} />} label="Explorer" onClick={run(() => ui.setActiveView("explorer"))} />
          <MenuItem icon={<Search size={13} />} label="Search" onClick={run(() => ui.setActiveView("search"))} />
          <MenuItem icon={<Bot size={13} />} label="AI Chat" onClick={run(() => ui.setActiveView("ai"))} />
          <MenuSeparator />
          <MenuLabel>Color Theme</MenuLabel>
          <MenuItem icon={<Moon size={13} />} label="Dark" active={ui.theme === "dark"} onClick={run(() => ui.setTheme("dark"))} />
          <MenuItem icon={<SunMedium size={13} />} label="Light" active={ui.theme === "light"} onClick={run(() => ui.setTheme("light"))} />
        </>
      ),
    },
    {
      id: "go",
      label: "Go",
      render: () => (
        <>
          <MenuItem icon={<Search size={13} />} label="Go to File / Search…" shortcut="Ctrl+P" onClick={run(() => ui.setActiveView("search"))} />
          <MenuItem icon={<ArrowRightToLine size={13} />} label="Go to Line…" shortcut="Ctrl+G" onClick={run(() => runEditorCommand("editor.action.gotoLine"))} />
          <MenuItem icon={<Code2 size={13} />} label="Go to Symbol…" shortcut="Ctrl+Shift+O" onClick={run(() => runEditorCommand("editor.action.quickOutline"))} />
        </>
      ),
    },
    {
      id: "run",
      label: "Run",
      render: () => (
        <>
          <MenuItem icon={<Play size={13} />} label="Run Active File in Terminal" disabled={!editor.activeTabId} onClick={run(() => runActiveFile())} />
          <MenuItem icon={<TerminalSquare size={13} />} label="New Terminal" shortcut="Ctrl+Shift+`" onClick={run(() => { terminal.createSession().catch(console.error); ui.terminalVisible || ui.toggleTerminal(); })} />
        </>
      ),
    },
    {
      id: "terminal",
      label: "Terminal",
      render: () => (
        <>
          <MenuItem icon={<TerminalSquare size={13} />} label="New Terminal" shortcut="Ctrl+Shift+`" onClick={run(() => { terminal.createSession().catch(console.error); ui.terminalVisible || ui.toggleTerminal(); })} />
          <MenuItem icon={<PanelBottom size={13} />} label="Toggle Terminal" shortcut="Ctrl+`" onClick={run(ui.toggleTerminal)} />
          <MenuSeparator />
          <MenuItem icon={<X size={13} />} label="Close Active Terminal" disabled={!terminal.activeSessionId} onClick={run(() => terminal.activeSessionId && terminal.closeSession(terminal.activeSessionId).catch(console.error))} />
        </>
      ),
    },
    {
      id: "help",
      label: "Help",
      render: () => (
        <>
          <MenuItem icon={<Info size={13} />} label="About FluxIDE" onClick={run(() => ui.setActiveView("settings"))} />
          <MenuItem icon={<Bot size={13} />} label="AI Models & Settings" onClick={run(() => ui.setActiveView("settings"))} />
        </>
      ),
    },
  ];

  // Run the active file with a sensible interpreter based on language.
  function runActiveFile() {
    const tab = editor.getActiveTab();
    if (!tab?.path) return;
    const runners: Record<string, string> = {
      python: "python",
      javascript: "node",
      typescript: "npx ts-node",
      shell: "bash",
    };
    const cmd = runners[tab.language];
    if (!cmd || !terminal.activeSessionId) {
      if (!ui.terminalVisible) ui.toggleTerminal();
      terminal.createSession().catch(console.error);
      return;
    }
    if (!ui.terminalVisible) ui.toggleTerminal();
    terminal.writeToSession(terminal.activeSessionId, `${cmd} "${tab.path}"\r`).catch(console.error);
  }

  return (
    <div className="flex items-center h-full">
      {menus.map((m) => (
        <button
          key={m.id}
          ref={(el) => (anchors.current[m.id] = el)}
          onClick={() => setOpen((cur) => (cur === m.id ? null : m.id))}
          onMouseEnter={() => open && setOpen(m.id)}
          className={cn(
            "px-2.5 h-7 flex items-center text-xs rounded transition-colors select-none",
            open === m.id
              ? "bg-flux-accent/20 text-flux-text"
              : "text-flux-muted hover:text-flux-text hover:bg-flux-surface"
          )}
        >
          {m.label}
        </button>
      ))}

      {open && (
        <MenuPanel
          anchor={anchors.current[open]?.getBoundingClientRect() ?? null}
          placement="bottom-start"
          width={236}
          onClose={close}
        >
          {menus.find((m) => m.id === open)?.render()}
        </MenuPanel>
      )}
    </div>
  );
}

async function closeWindow() {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().close();
  } catch (e) {
    console.warn("Window close is only available in the desktop app", e);
  }
}
