import { useRef, useCallback, useEffect } from "react";
import Editor, { OnMount, OnChange, BeforeMount } from "@monaco-editor/react";
import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useEditorStore } from "@/store/editorStore";
import { useAIStore } from "@/store/aiStore";
import { useUIStore } from "@/store/uiStore";
import { useExtensionsStore } from "@/store/extensionsStore";
import { setActiveEditor } from "@/services/editorBridge";
import { EditorTab } from "@/types";

interface MonacoEditorProps {
  tab: EditorTab;
}

export function MonacoEditor({ tab }: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const { updateContent, setPosition, setSelection, saveFile } = useEditorStore();
  const { sendMessage, status } = useAIStore();
  const theme = useUIStore((s) => s.theme);
  const monacoTheme = theme === "light" ? "fluxide-light" : "fluxide-dark";
  const ext = useExtensionsStore((s) => s.enabled);

  // Re-apply the editor theme whenever the app theme changes.
  useEffect(() => {
    monacoRef.current?.editor.setTheme(monacoTheme);
  }, [monacoTheme]);

  // Detach the shared editor handle on unmount.
  useEffect(() => () => setActiveEditor(null), []);

  const handleBeforeMount: BeforeMount = (monaco) => {
    // Define FluxIDE light theme
    monaco.editor.defineTheme("fluxide-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "8a909c", fontStyle: "italic" },
        { token: "keyword", foreground: "a626a4" },
        { token: "string", foreground: "50a14f" },
        { token: "number", foreground: "b76b01" },
        { token: "type", foreground: "c18401" },
        { token: "class", foreground: "c18401" },
        { token: "function", foreground: "4078f2" },
        { token: "variable", foreground: "e45649" },
        { token: "operator", foreground: "0184bc" },
        { token: "delimiter", foreground: "383a42" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#1e2128",
        "editor.lineHighlightBackground": "#f4f5f7",
        "editor.selectionBackground": "#cfe0ff",
        "editorCursor.foreground": "#5b5ef0",
        "editorIndentGuide.background": "#e8e9ee",
        "editorIndentGuide.activeBackground": "#d7d9e0",
        "editorLineNumber.foreground": "#c8cbd4",
        "editorLineNumber.activeForeground": "#6b7280",
        "editorWidget.background": "#f4f5f7",
        "editorWidget.border": "#d7d9e0",
        "input.background": "#ffffff",
        "input.border": "#d7d9e0",
      },
    });

    // Define FluxIDE dark theme
    monaco.editor.defineTheme("fluxide-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "5c6370", fontStyle: "italic" },
        { token: "keyword", foreground: "c678dd" },
        { token: "string", foreground: "98c379" },
        { token: "number", foreground: "d19a66" },
        { token: "type", foreground: "e5c07b" },
        { token: "class", foreground: "e5c07b" },
        { token: "function", foreground: "61afef" },
        { token: "variable", foreground: "e06c75" },
        { token: "operator", foreground: "56b6c2" },
        { token: "delimiter", foreground: "abb2bf" },
      ],
      colors: {
        "editor.background": "#0d0d0f",
        "editor.foreground": "#e2e2e8",
        "editor.lineHighlightBackground": "#1a1a1e",
        "editor.selectionBackground": "#264f78",
        "editor.inactiveSelectionBackground": "#3a3d41",
        "editorCursor.foreground": "#6366f1",
        "editorWhitespace.foreground": "#2a2a30",
        "editorIndentGuide.background": "#2a2a30",
        "editorIndentGuide.activeBackground": "#3a3a44",
        "editorLineNumber.foreground": "#3a3a44",
        "editorLineNumber.activeForeground": "#6b6b78",
        "editor.findMatchBackground": "#613315",
        "editor.findMatchHighlightBackground": "#3a2010",
        "scrollbar.shadow": "#000000",
        "scrollbarSlider.background": "#2a2a3080",
        "scrollbarSlider.hoverBackground": "#3a3a4480",
        "scrollbarSlider.activeBackground": "#4a4a5480",
        "editorWidget.background": "#141416",
        "editorWidget.border": "#2a2a30",
        "input.background": "#1a1a1e",
        "input.border": "#2a2a30",
        "list.hoverBackground": "#1a1a1e",
        "list.activeSelectionBackground": "#264f78",
      },
    });

    // Set TypeScript compiler options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: "React",
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    });
  };

  const handleMount: OnMount = (editorInstance, monaco) => {
    editorRef.current = editorInstance;
    monacoRef.current = monaco;
    setActiveEditor(editorInstance);
    editorInstance.onDidFocusEditorText(() => setActiveEditor(editorInstance));

    // Apply theme
    monaco.editor.setTheme(monacoTheme);

    // Track cursor position
    editorInstance.onDidChangeCursorPosition((e) => {
      setPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // Track selection
    editorInstance.onDidChangeCursorSelection((e) => {
      const sel = e.selection;
      if (sel.isEmpty()) {
        setSelection(null);
      } else {
        const model = editorInstance.getModel();
        if (model) {
          setSelection({
            startLine: sel.startLineNumber,
            startColumn: sel.startColumn,
            endLine: sel.endLineNumber,
            endColumn: sel.endColumn,
            text: model.getValueInRange(sel),
          });
        }
      }
    });

    // Add AI explain command
    editorInstance.addAction({
      id: "flux-explain-selection",
      label: "FluxIDE: Explain Selected Code",
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyE,
      ],
      contextMenuGroupId: "flux",
      contextMenuOrder: 1,
      run: (ed) => {
        const selection = ed.getSelection();
        if (!selection) return;
        const model = ed.getModel();
        if (!model) return;
        const text = model.getValueInRange(selection);
        if (text.trim()) {
          sendMessage(`Explain this ${tab.language} code:\n\`\`\`${tab.language}\n${text}\n\`\`\``);
        }
      },
    });

    // Add AI fix command
    editorInstance.addAction({
      id: "flux-fix-selection",
      label: "FluxIDE: Fix/Improve Selected Code",
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      ],
      contextMenuGroupId: "flux",
      contextMenuOrder: 2,
      run: (ed) => {
        const selection = ed.getSelection();
        if (!selection) return;
        const model = ed.getModel();
        if (!model) return;
        const text = model.getValueInRange(selection);
        if (text.trim()) {
          sendMessage(`Fix and improve this ${tab.language} code:\n\`\`\`${tab.language}\n${text}\n\`\`\``);
        }
      },
    });

    // Save shortcut
    editorInstance.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => saveFile()
    );

    // Focus editor
    editorInstance.focus();
  };

  const handleChange: OnChange = useCallback(
    (value) => {
      if (value !== undefined) {
        updateContent(tab.id, value);
      }
    },
    [tab.id, updateContent]
  );

  return (
    <div className="flex-1 h-full overflow-hidden">
      <Editor
        height="100%"
        language={tab.language}
        value={tab.content}
        theme={monacoTheme}
        onChange={handleChange}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        options={{
          fontSize: 14,
          fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
          fontLigatures: true,
          lineNumbers: "on",
          minimap: { enabled: ext["minimap"] ?? true, scale: 1 },
          scrollBeyondLastLine: false,
          wordWrap: ext["word-wrap"] ? "on" : "off",
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          renderWhitespace: "selection",
          bracketPairColorization: { enabled: ext["bracket-colorization"] ?? true },
          formatOnPaste: true,
          formatOnType: false,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",
          snippetSuggestions: "top",
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: ext["smooth-cursor"] ? "on" : "off",
          smoothScrolling: ext["smooth-cursor"] ?? true,
          padding: { top: 12, bottom: 12 },
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          renderLineHighlight: "line",
          selectionHighlight: true,
          occurrencesHighlight: "singleFile",
          contextmenu: true,
          mouseWheelZoom: true,
          guides: {
            bracketPairs: true,
            indentation: true,
          },
        }}
      />
    </div>
  );
}
