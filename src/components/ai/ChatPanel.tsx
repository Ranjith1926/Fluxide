import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Square,
  Trash2,
  RotateCcw,
  Bot,
  ChevronDown,
  Code,
  Wrench,
  FileText,
  Sparkles,
} from "lucide-react";
import { useAIStore } from "@/store/aiStore";
import { useEditorStore } from "@/store/editorStore";
import { ChatMessage } from "./ChatMessage";
import { ModelDownloader } from "./ModelDownloader";
import { cn } from "@/services/utils";
import {
  buildExplainPrompt,
  buildFixPrompt,
  buildRefactorPrompt,
  SYSTEM_CODING_ASSISTANT,
  SYSTEM_CODE_EXPLAINER,
  SYSTEM_BUG_FIXER,
  SYSTEM_REFACTOR,
} from "@/services/prompts";

export function ChatPanel() {
  const [input, setInput] = useState("");
  const [showModelSetup, setShowModelSetup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isStreaming,
    status,
    sendMessage,
    cancelGeneration,
    clearHistory,
    retryLastMessage,
    setSystemPrompt,
  } = useAIStore();

  const { getActiveTab, selection } = useEditorStore();
  const activeTab = getActiveTab();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const message = input.trim();
    setInput("");

    // Include selected code context if available
    const contextFiles = activeTab ? [activeTab.path] : undefined;

    let fullMessage = message;
    if (selection?.text && activeTab) {
      fullMessage = `${message}\n\n\`\`\`${activeTab.language}\n${selection.text}\n\`\`\``;
    }

    await sendMessage(fullMessage, contextFiles);
  }, [input, isStreaming, sendMessage, activeTab, selection]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = async (action: "explain" | "fix" | "refactor") => {
    if (!activeTab) return;

    const code = selection?.text || activeTab.content;
    const language = activeTab.language;

    let prompt = "";
    let systemPrompt = SYSTEM_CODING_ASSISTANT;

    switch (action) {
      case "explain":
        prompt = buildExplainPrompt(code, language, activeTab.name);
        systemPrompt = SYSTEM_CODE_EXPLAINER;
        break;
      case "fix":
        prompt = buildFixPrompt(code, language);
        systemPrompt = SYSTEM_BUG_FIXER;
        break;
      case "refactor":
        prompt = buildRefactorPrompt(code, language);
        systemPrompt = SYSTEM_REFACTOR;
        break;
    }

    setSystemPrompt(systemPrompt);
    await sendMessage(prompt, [activeTab.path]);
    setSystemPrompt(SYSTEM_CODING_ASSISTANT);
  };

  if (showModelSetup || (!status.engine_running && messages.length === 0)) {
    return (
      <div className="flex flex-col h-full">
        <ChatHeader onClear={clearHistory} />
        <div className="flex-1 overflow-y-auto">
          <ModelDownloader />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        onClear={clearHistory}
        onShowModels={() => setShowModelSetup(true)}
        modelStatus={status}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        {messages.length === 0 ? (
          <EmptyState
            hasFile={!!activeTab}
            onQuickAction={handleQuickAction}
          />
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick actions for active file */}
      {activeTab && messages.length === 0 && (
        <QuickActions
          filename={activeTab.name}
          hasSelection={!!selection?.text}
          onAction={handleQuickAction}
        />
      )}

      {/* Retry button */}
      {!isStreaming && messages.length > 0 && (
        <div className="flex justify-center pb-1">
          <button
            onClick={retryLastMessage}
            className="flex items-center gap-1 text-2xs text-flux-muted hover:text-flux-text transition-colors py-1 px-2"
          >
            <RotateCcw size={11} />
            Retry
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-flux-border p-3">
        {selection?.text && (
          <div className="mb-2 px-2 py-1 bg-flux-accent/10 border border-flux-accent/20 rounded text-2xs text-flux-accent flex items-center gap-1">
            <Code size={10} />
            <span>
              {selection.endLine - selection.startLine + 1} lines selected from {activeTab?.name}
            </span>
          </div>
        )}

        <div className="flex items-end gap-2 bg-flux-surface border border-flux-border rounded-xl p-2 focus-within:border-flux-accent transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              status.engine_running
                ? "Ask AI anything… (Enter to send, Shift+Enter for newline)"
                : "Start the AI engine to chat…"
            }
            disabled={!status.engine_running || isStreaming}
            rows={1}
            className={cn(
              "flex-1 bg-transparent text-sm text-flux-text placeholder:text-flux-muted resize-none outline-none leading-relaxed max-h-36",
              (!status.engine_running || isStreaming) && "opacity-50 cursor-not-allowed"
            )}
          />

          {isStreaming ? (
            <button
              onClick={cancelGeneration}
              className="p-1.5 rounded-lg bg-flux-error/20 text-flux-error hover:bg-flux-error/30 transition-colors shrink-0"
              title="Stop generation"
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || !status.engine_running}
              className={cn(
                "p-1.5 rounded-lg transition-all shrink-0",
                input.trim() && status.engine_running
                  ? "bg-flux-accent text-white hover:bg-flux-accent-dim shadow-glow-sm"
                  : "bg-flux-border text-flux-muted cursor-not-allowed"
              )}
              title="Send message"
            >
              <Send size={14} />
            </button>
          )}
        </div>

        <p className="text-2xs text-flux-muted mt-1.5 text-center">
          {status.engine_running
            ? `${status.active_model ?? "AI"} • Runs locally`
            : "AI engine offline"}
        </p>
      </div>
    </div>
  );
}

function ChatHeader({
  onClear,
  onShowModels,
  modelStatus,
}: {
  onClear: () => void;
  onShowModels?: () => void;
  modelStatus?: { engine_running: boolean; active_model: string | null };
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-flux-border shrink-0">
      <div className="flex items-center gap-2">
        <Bot size={14} className="text-flux-accent" />
        <span className="text-xs font-semibold text-flux-text">AI Assistant</span>
        {modelStatus?.engine_running && (
          <span className="w-1.5 h-1.5 rounded-full bg-flux-success" />
        )}
      </div>
      <div className="flex items-center gap-1">
        {onShowModels && (
          <button
            onClick={onShowModels}
            title="Models"
            className="p-1 rounded text-flux-muted hover:text-flux-text hover:bg-flux-surface transition-colors"
          >
            <Sparkles size={13} />
          </button>
        )}
        <button
          onClick={onClear}
          title="Clear chat"
          className="p-1 rounded text-flux-muted hover:text-flux-text hover:bg-flux-surface transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  hasFile,
  onQuickAction,
}: {
  hasFile: boolean;
  onQuickAction: (action: "explain" | "fix" | "refactor") => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 gap-4">
      <div className="w-10 h-10 rounded-xl bg-flux-accent/20 border border-flux-accent/30 flex items-center justify-center">
        <Bot size={20} className="text-flux-accent" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-flux-text">FluxIDE AI</p>
        <p className="text-xs text-flux-muted mt-1">
          Ask me to write, explain, or fix code
        </p>
      </div>

      {hasFile && (
        <div className="flex flex-col gap-1.5 w-full">
          <p className="text-2xs text-flux-muted text-center">Quick actions</p>
          {[
            { action: "explain" as const, icon: <FileText size={12} />, label: "Explain current file" },
            { action: "fix" as const, icon: <Wrench size={12} />, label: "Find & fix bugs" },
            { action: "refactor" as const, icon: <Code size={12} />, label: "Refactor code" },
          ].map(({ action, icon, label }) => (
            <button
              key={action}
              onClick={() => onQuickAction(action)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-flux-muted hover:text-flux-text bg-flux-surface hover:bg-flux-panel border border-flux-border rounded-lg transition-colors"
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickActions({
  filename,
  hasSelection,
  onAction,
}: {
  filename: string;
  hasSelection: boolean;
  onAction: (action: "explain" | "fix" | "refactor") => void;
}) {
  return (
    <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
      {[
        { action: "explain" as const, label: hasSelection ? "Explain selection" : "Explain file" },
        { action: "fix" as const, label: "Fix bugs" },
        { action: "refactor" as const, label: "Refactor" },
      ].map(({ action, label }) => (
        <button
          key={action}
          onClick={() => onAction(action)}
          className="px-2 py-1 text-2xs bg-flux-surface hover:bg-flux-panel border border-flux-border text-flux-muted hover:text-flux-text rounded-md transition-colors"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
