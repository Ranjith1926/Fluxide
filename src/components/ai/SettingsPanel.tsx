import { useState } from "react";
import { Settings, Zap, Download, Info, Palette, Moon, SunMedium } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { ThemeMode } from "@/types";
import { ModelDownloader } from "./ModelDownloader";
import { cn } from "@/services/utils";

export function SettingsPanel() {
  const [activeSection, setActiveSection] = useState<"appearance" | "models" | "about">(
    "appearance"
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-flux-border">
        <Settings size={14} className="text-flux-muted" />
        <span className="text-xs font-semibold text-flux-text">Settings</span>
      </div>

      {/* Nav tabs */}
      <div className="flex border-b border-flux-border">
        {[
          { id: "appearance", icon: <Palette size={12} />, label: "Appearance" },
          { id: "models", icon: <Download size={12} />, label: "Models" },
          { id: "about", icon: <Info size={12} />, label: "About" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-colors border-b-2 ${
              activeSection === tab.id
                ? "border-flux-accent text-flux-accent"
                : "border-transparent text-flux-muted hover:text-flux-text"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === "appearance" && <AppearanceSection />}
        {activeSection === "models" && <ModelDownloader />}
        {activeSection === "about" && <AboutSection />}
      </div>
    </div>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useUIStore();

  const options: { id: ThemeMode; label: string; icon: JSX.Element; swatch: string[] }[] = [
    { id: "dark", label: "Dark", icon: <Moon size={15} />, swatch: ["#0d0d0f", "#1a1a1e", "#6366f1"] },
    { id: "light", label: "Light", icon: <SunMedium size={15} />, swatch: ["#ffffff", "#e8e9ee", "#5b5ef0"] },
  ];

  return (
    <div className="p-3">
      <p className="text-2xs font-semibold uppercase tracking-wider text-flux-muted mb-2">
        Color Theme
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setTheme(opt.id)}
            className={cn(
              "flex flex-col gap-2 p-2.5 rounded-lg border text-left transition-colors",
              theme === opt.id
                ? "border-flux-accent bg-flux-accent/10"
                : "border-flux-border bg-flux-surface hover:border-flux-muted"
            )}
          >
            <div className="flex h-8 rounded overflow-hidden border border-flux-border">
              {opt.swatch.map((c) => (
                <div key={c} className="flex-1" style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={theme === opt.id ? "text-flux-accent" : "text-flux-muted"}>
                {opt.icon}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  theme === opt.id ? "text-flux-accent" : "text-flux-text"
                )}
              >
                {opt.label}
              </span>
            </div>
          </button>
        ))}
      </div>
      <p className="text-2xs text-flux-muted mt-3">
        The theme applies across the editor, terminal, and panels and is remembered between sessions.
      </p>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-flux-accent/20 border border-flux-accent/30 flex items-center justify-center">
        <Zap size={28} className="text-flux-accent" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-flux-text">FluxIDE</h2>
        <p className="text-sm text-flux-accent font-medium">Offline AI Coding. Supercharged.</p>
        <p className="text-xs text-flux-muted mt-2">Version 1.0.0</p>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full text-xs">
        {[
          ["Runtime", "Tauri + Rust"],
          ["Editor", "Monaco Editor"],
          ["Terminal", "xterm.js + PTY"],
          ["AI Engine", "llama.cpp"],
          ["UI", "React + Tailwind"],
          ["State", "Zustand"],
        ].map(([k, v]) => (
          <div key={k} className="bg-flux-surface border border-flux-border rounded-lg p-2 text-left">
            <div className="text-2xs text-flux-muted">{k}</div>
            <div className="text-flux-text font-medium mt-0.5">{v}</div>
          </div>
        ))}
      </div>

      <p className="text-2xs text-flux-muted">
        Built with ❤️ for developers who value privacy and performance.
      </p>
    </div>
  );
}
