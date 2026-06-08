import { useEffect, useRef, useCallback } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { listen } from "@tauri-apps/api/event";
import { useTerminalStore } from "@/store/terminalStore";
import "@xterm/xterm/css/xterm.css";

interface TerminalProps {
  sessionId: string;
  isActive: boolean;
}

export function Terminal({ sessionId, isActive }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { writeToSession, resizeSession } = useTerminalStore();

  const fit = useCallback(() => {
    if (fitAddonRef.current && xtermRef.current) {
      try {
        fitAddonRef.current.fit();
        const { cols, rows } = xtermRef.current;
        resizeSession(sessionId, cols, rows).catch(() => {});
      } catch (e) {
        // Ignore fit errors
      }
    }
  }, [sessionId, resizeSession]);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      theme: {
        background: "#0d0d0f",
        foreground: "#e2e2e8",
        cursor: "#6366f1",
        cursorAccent: "#0d0d0f",
        selectionBackground: "rgba(99,102,241,0.3)",
        black: "#1a1a1e",
        red: "#ef4444",
        green: "#22c55e",
        yellow: "#f59e0b",
        blue: "#3b82f6",
        magenta: "#a855f7",
        cyan: "#06b6d4",
        white: "#e2e2e8",
        brightBlack: "#6b6b78",
        brightRed: "#f87171",
        brightGreen: "#4ade80",
        brightYellow: "#fbbf24",
        brightBlue: "#60a5fa",
        brightMagenta: "#c084fc",
        brightCyan: "#22d3ee",
        brightWhite: "#f1f1f5",
      },
      fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: "bar",
      scrollback: 5000,
      allowProposedApi: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(containerRef.current);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Fit after open
    requestAnimationFrame(() => fit());

    // Handle user input
    term.onData((data) => {
      writeToSession(sessionId, data).catch(() => {});
    });

    // Clipboard: Ctrl+V / Ctrl+Shift+V to paste, Ctrl+C to copy a selection
    term.attachCustomKeyEventHandler((e) => {
      if (e.type !== "keydown") return true;

      // Paste — preventDefault stops the webview's native paste so we don't
      // write the clipboard text twice (native paste + this manual read).
      if (e.ctrlKey && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        navigator.clipboard
          .readText()
          .then((text) => {
            if (text) writeToSession(sessionId, text).catch(() => {});
          })
          .catch(() => {});
        return false;
      }

      // Copy selection (only when text is selected, so Ctrl+C still
      // sends SIGINT when nothing is selected)
      if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
        const selection = term.getSelection();
        if (selection) {
          navigator.clipboard.writeText(selection).catch(() => {});
          return false;
        }
      }

      return true;
    });

    // Listen for terminal output from Rust
    const unlisten = listen<{ data: string }>(
      `terminal-output-${sessionId}`,
      (event) => {
        term.write(event.payload.data);
      }
    );

    // Listen for terminal exit
    const unlistenExit = listen<{ code: number }>(
      `terminal-exit-${sessionId}`,
      () => {
        term.write("\r\n\x1b[90m[Process exited]\x1b[0m\r\n");
      }
    );

    // ResizeObserver for automatic fitting
    const ro = new ResizeObserver(() => fit());
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    return () => {
      ro.disconnect();
      unlisten.then((fn) => fn());
      unlistenExit.then((fn) => fn());
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [sessionId]);

  // Re-fit when panel becomes visible/active
  useEffect(() => {
    if (isActive) {
      requestAnimationFrame(() => fit());
      xtermRef.current?.focus();
    }
  }, [isActive, fit]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ padding: "4px 8px" }}
    />
  );
}
