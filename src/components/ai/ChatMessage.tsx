import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, User, Bot, Loader2 } from "lucide-react";
import { ChatMessage as ChatMessageType } from "@/types";
import { cn } from "@/services/utils";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3 group",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
          isUser
            ? "bg-flux-accent text-white"
            : "bg-flux-surface border border-flux-border text-flux-accent"
        )}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Content */}
      <div
        className={cn(
          "flex flex-col gap-1 max-w-[85%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        {isUser ? (
          <div className="bg-flux-accent/20 border border-flux-accent/30 rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-flux-text">
            {message.content}
          </div>
        ) : (
          <div className="bg-flux-surface border border-flux-border rounded-2xl rounded-tl-sm px-3 py-2 w-full prose-sm">
            {message.isStreaming && !message.content ? (
              <div className="flex items-center gap-2 text-flux-muted text-xs">
                <Loader2 size={12} className="animate-spin" />
                <span>Thinking…</span>
              </div>
            ) : (
              <MarkdownContent content={message.content} />
            )}
            {message.isStreaming && message.content && (
              <span className="inline-block w-1.5 h-4 bg-flux-accent animate-pulse ml-0.5" />
            )}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-2xs text-flux-muted opacity-0 group-hover:opacity-100 transition-opacity px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          const language = match?.[1] ?? "text";
          const codeString = String(children).replace(/\n$/, "");
          const isInline = !match;

          if (isInline) {
            return (
              <code
                className="px-1 py-0.5 rounded text-xs font-mono bg-flux-panel text-flux-accent border border-flux-border"
                {...props}
              >
                {children}
              </code>
            );
          }

          return (
            <CodeBlock language={language} code={codeString} />
          );
        },
        p({ children }) {
          return <p className="text-sm text-flux-text mb-2 last:mb-0 leading-relaxed">{children}</p>;
        },
        ul({ children }) {
          return <ul className="list-disc list-inside text-sm text-flux-text mb-2 space-y-0.5">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside text-sm text-flux-text mb-2 space-y-0.5">{children}</ol>;
        },
        li({ children }) {
          return <li className="text-sm text-flux-text">{children}</li>;
        },
        h1({ children }) {
          return <h1 className="text-base font-bold text-flux-text mb-2 mt-3">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="text-sm font-bold text-flux-text mb-1.5 mt-2">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="text-sm font-semibold text-flux-text mb-1 mt-2">{children}</h3>;
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-2 border-flux-accent pl-3 my-2 text-flux-muted italic">
              {children}
            </blockquote>
          );
        },
        strong({ children }) {
          return <strong className="font-semibold text-flux-text">{children}</strong>;
        },
        hr() {
          return <hr className="border-flux-border my-3" />;
        },
        a({ href, children }) {
          return (
            <a href={href} className="text-flux-accent underline underline-offset-2 hover:no-underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          );
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-2">
              <table className="text-xs border-collapse w-full">{children}</table>
            </div>
          );
        },
        th({ children }) {
          return (
            <th className="border border-flux-border px-2 py-1 bg-flux-panel text-left font-semibold text-flux-text">
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td className="border border-flux-border px-2 py-1 text-flux-muted">
              {children}
            </td>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/code rounded-lg overflow-hidden border border-flux-border my-2">
      {/* Code header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-flux-panel border-b border-flux-border">
        <span className="text-2xs text-flux-muted font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-2xs text-flux-muted hover:text-flux-text transition-colors"
        >
          {copied ? (
            <>
              <Check size={11} className="text-flux-success" />
              <span className="text-flux-success">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <SyntaxHighlighter
        style={vscDarkPlus as any}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          background: "#0d0d0f",
          fontSize: "12px",
          padding: "12px",
          overflowX: "auto",
        }}
        codeTagProps={{
          style: {
            fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
