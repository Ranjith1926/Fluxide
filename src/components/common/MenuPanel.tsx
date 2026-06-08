import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/services/utils";

interface MenuPanelProps {
  /** Bounding rect of the trigger element. */
  anchor: DOMRect | null;
  /** Where the panel is anchored relative to the trigger. */
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  width?: number;
  onClose: () => void;
  children: ReactNode;
}

/**
 * A lightweight popover rendered into <body> with fixed positioning so it is
 * never clipped by ancestor `overflow-hidden`. Closes on outside-click or Escape.
 */
export function MenuPanel({
  anchor,
  placement = "bottom-start",
  width,
  onClose,
  children,
}: MenuPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!anchor) return;
    const el = ref.current;
    const w = el?.offsetWidth ?? width ?? 200;
    const h = el?.offsetHeight ?? 0;
    const gap = 4;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = placement.endsWith("end") ? anchor.right - w : anchor.left;
    let top = placement.startsWith("top") ? anchor.top - h - gap : anchor.bottom + gap;

    // Keep inside the viewport.
    left = Math.max(6, Math.min(left, vw - w - 6));
    top = Math.max(6, Math.min(top, vh - h - 6));

    setPos({ top, left });
  }, [anchor, placement, width, children]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!anchor) return null;

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        width,
        visibility: pos ? "visible" : "hidden",
      }}
      className="z-[1000] py-1 rounded-lg bg-flux-panel border border-flux-border shadow-xl shadow-black/40 animate-fade-in"
    >
      {children}
    </div>,
    document.body
  );
}

interface MenuItemProps {
  icon?: ReactNode;
  label: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
}

export function MenuItem({ icon, label, shortcut, disabled, active, onClick }: MenuItemProps) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left transition-colors",
        disabled
          ? "text-flux-muted/50 cursor-not-allowed"
          : "text-flux-text hover:bg-flux-accent hover:text-white",
        active && "text-flux-accent"
      )}
    >
      {icon !== undefined && (
        <span className="w-4 flex items-center justify-center shrink-0">{icon}</span>
      )}
      <span className="flex-1 whitespace-nowrap">{label}</span>
      {shortcut && (
        <span className="text-2xs text-flux-muted ml-6 tracking-wide">{shortcut}</span>
      )}
    </button>
  );
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-flux-border" />;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pt-1.5 pb-0.5 text-2xs font-semibold uppercase tracking-wider text-flux-muted">
      {children}
    </div>
  );
}
