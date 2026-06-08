import { useRef, useState } from "react";
import {
  Files,
  Search,
  Bot,
  Blocks,
  Settings,
  SunMedium,
  Moon,
  Sliders,
  Info,
  Palette,
} from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useAIStore } from "@/store/aiStore";
import { MenuPanel, MenuItem, MenuSeparator, MenuLabel } from "@/components/common/MenuPanel";
import { ActivityView } from "@/types";
import { cn } from "@/services/utils";

interface ActivityItem {
  id: ActivityView;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

export function ActivityBar() {
  const { activeView, setActiveView } = useUIStore();
  const { status, isStreaming } = useAIStore();

  const items: ActivityItem[] = [
    { id: "explorer", icon: <Files size={22} />, label: "Explorer" },
    { id: "search", icon: <Search size={22} />, label: "Search" },
    { id: "extensions", icon: <Blocks size={22} />, label: "Extensions" },
    { id: "ai", icon: <Bot size={22} />, label: "AI Chat" },
  ];

  return (
    <div className="flex flex-col items-center w-12 bg-flux-bg border-r border-flux-border h-full py-2 gap-1 shrink-0">
      {items.map((item) => (
        <ActivityButton
          key={item.id}
          item={item}
          isActive={activeView === item.id}
          onClick={() => setActiveView(item.id)}
          extraIndicator={
            item.id === "ai"
              ? status.engine_running
                ? "green"
                : status.loading
                ? "yellow"
                : "red"
              : undefined
          }
        />
      ))}

      <div className="flex-1" />

      <SettingsButton />
    </div>
  );
}

function SettingsButton() {
  const { activeView, setActiveView, theme, setTheme } = useUIStore();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const act = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        title="Manage"
        className={cn(
          "relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-150",
          open || activeView === "settings"
            ? "bg-flux-accent/20 text-flux-accent"
            : "text-flux-muted hover:text-flux-text hover:bg-flux-surface"
        )}
      >
        <Settings size={22} className={open ? "rotate-45 transition-transform" : "transition-transform"} />
      </button>

      {open && (
        <MenuPanel
          anchor={btnRef.current?.getBoundingClientRect() ?? null}
          placement="top-start"
          width={210}
          onClose={() => setOpen(false)}
        >
          <MenuItem icon={<Sliders size={13} />} label="Settings" onClick={act(() => setActiveView("settings"))} />
          <MenuItem icon={<Bot size={13} />} label="AI Models" onClick={act(() => setActiveView("settings"))} />
          <MenuSeparator />
          <MenuLabel>
            <span className="flex items-center gap-1.5">
              <Palette size={11} /> Color Theme
            </span>
          </MenuLabel>
          <MenuItem icon={<Moon size={13} />} label="Dark" active={theme === "dark"} onClick={act(() => setTheme("dark"))} />
          <MenuItem icon={<SunMedium size={13} />} label="Light" active={theme === "light"} onClick={act(() => setTheme("light"))} />
          <MenuSeparator />
          <MenuItem icon={<Info size={13} />} label="About FluxIDE" onClick={act(() => setActiveView("settings"))} />
        </MenuPanel>
      )}
    </>
  );
}

interface ActivityButtonProps {
  item: ActivityItem;
  isActive: boolean;
  onClick: () => void;
  extraIndicator?: "green" | "yellow" | "red";
}

function ActivityButton({ item, isActive, onClick, extraIndicator }: ActivityButtonProps) {
  return (
    <button
      onClick={onClick}
      title={item.label}
      className={cn(
        "relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-150 group",
        isActive
          ? "bg-flux-accent/20 text-flux-accent"
          : "text-flux-muted hover:text-flux-text hover:bg-flux-surface"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-flux-accent rounded-r-full" />
      )}
      {item.icon}
      {extraIndicator && (
        <span
          className={cn(
            "absolute bottom-1 right-1 w-2 h-2 rounded-full border border-flux-bg",
            extraIndicator === "green" && "bg-flux-success",
            extraIndicator === "yellow" && "bg-flux-warning animate-pulse",
            extraIndicator === "red" && "bg-flux-muted"
          )}
        />
      )}
      <span className="absolute left-full ml-2 px-2 py-1 text-xs bg-flux-panel border border-flux-border rounded text-flux-text whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
        {item.label}
      </span>
    </button>
  );
}
