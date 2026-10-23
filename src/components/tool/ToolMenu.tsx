import { createSignal, For, type JSX, onCleanup, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { TOOL_ACTION_BASE_CLASSES, TOOL_ACTION_CLASSES } from "@/components/ToolActionButton";
import { cn } from "@/lib/cn";

export interface ToolMenuItem {
  id: string;
  label: string;
  icon?: JSX.Element;
  disabled?: boolean;
}

export interface ToolMenuProps {
  /** Accessible name of the menu button. */
  label: string;
  /** Trigger content (icon + optional label). Styles follow the secondary action button. */
  children: JSX.Element;
  title?: string;
  compact?: boolean;
  disabled?: boolean;
  items: readonly ToolMenuItem[];
  onSelect: (item: ToolMenuItem) => void;
}

const MENU_GAP = 8;

/**
 * A popover menu button. Replaces native <select>-based menus: our own themed
 * surface, keyboard navigation, Escape/outside-click dismissal, and focus
 * return. The menu is portaled to the document body with fixed positioning so
 * panel `overflow-hidden` can never clip it; it flips above the trigger when
 * the viewport is short. Entrance uses the shared tool-appear recipe (idle
 * under prefers-reduced-motion).
 */
export default function ToolMenu(props: ToolMenuProps) {
  const [open, setOpen] = createSignal(false);
  const [position, setPosition] = createSignal<{
    top: number;
    left: number;
    minWidth: number;
  } | null>(null);
  let trigger: HTMLButtonElement | undefined;
  let menu: HTMLDivElement | undefined;

  const focusItem = (index: number) => {
    const options = menu?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)');
    if (!options?.length) return;
    const bounded = Math.max(0, Math.min(index, options.length - 1));
    options[bounded]?.focus();
  };

  function openMenu(initialFocus: "first" | "last" = "first") {
    const rect = trigger?.getBoundingClientRect();
    if (!rect) return;
    setPosition({
      top: rect.bottom + MENU_GAP,
      left: rect.right,
      minWidth: Math.max(rect.width, 168),
    });
    setOpen(true);
    requestAnimationFrame(() => {
      if (!menu) return;
      const menuRect = menu.getBoundingClientRect();
      const flip =
        rect.bottom + MENU_GAP + menuRect.height > window.innerHeight - MENU_GAP &&
        rect.top - MENU_GAP - menuRect.height >= MENU_GAP;
      const top = flip
        ? rect.top - MENU_GAP - menuRect.height
        : Math.min(rect.bottom + MENU_GAP, window.innerHeight - menuRect.height - MENU_GAP);
      const left = Math.min(
        Math.max(MENU_GAP, rect.right - menuRect.width),
        window.innerWidth - menuRect.width - MENU_GAP
      );
      setPosition({ top, left, minWidth: Math.max(rect.width, 168) });
      focusItem(initialFocus === "first" ? 0 : Number.MAX_SAFE_INTEGER);
    });
  }

  function closeMenu(returnFocus = true) {
    if (!open()) return;
    setOpen(false);
    if (returnFocus) trigger?.focus();
  }

  function onMenuKeyDown(event: KeyboardEvent) {
    const options = Array.from(
      menu?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? []
    );
    const index = options.indexOf(document.activeElement as HTMLButtonElement);
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusItem(index + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusItem(index <= 0 ? options.length - 1 : index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusItem(0);
        break;
      case "End":
        event.preventDefault();
        focusItem(options.length - 1);
        break;
      case "Escape":
        event.preventDefault();
        closeMenu();
        break;
      case "Tab":
        closeMenu(false);
        break;
      default:
        break;
    }
  }

  function onDocumentKeyDown(event: KeyboardEvent) {
    if (open() && event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    }
  }

  function onDocumentPointerDown(event: PointerEvent) {
    if (!open()) return;
    const target = event.target as Node | null;
    if (!target || menu?.contains(target) || trigger?.contains(target)) return;
    closeMenu(false);
  }

  function onWindowScroll(event: Event) {
    if (!open()) return;
    const target = event.target;
    if (target instanceof Node && (target === menu || menu?.contains(target))) return;
    closeMenu(false);
  }

  document.addEventListener("keydown", onDocumentKeyDown);
  document.addEventListener("pointerdown", onDocumentPointerDown);
  window.addEventListener("scroll", onWindowScroll, { capture: true, passive: true });
  window.addEventListener("resize", () => closeMenu(false));
  onCleanup(() => {
    document.removeEventListener("keydown", onDocumentKeyDown);
    document.removeEventListener("pointerdown", onDocumentPointerDown);
    window.removeEventListener("scroll", onWindowScroll, { capture: true });
    window.removeEventListener("resize", () => closeMenu(false));
  });

  return (
    <div class="relative inline-flex">
      <button
        ref={trigger}
        type="button"
        class={cn(
          TOOL_ACTION_BASE_CLASSES,
          TOOL_ACTION_CLASSES.secondary,
          props.compact && "min-h-[var(--size-control-compact)] px-2.5 text-[var(--fs-label)]",
          props.disabled && "disabled:opacity-[var(--opacity-disabled)]"
        )}
        disabled={props.disabled}
        aria-haspopup="menu"
        aria-expanded={open()}
        aria-label={props.label}
        title={props.title ?? props.label}
        onClick={() => (open() ? closeMenu() : openMenu())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            openMenu();
          }
        }}
      >
        {props.children}
      </button>
      <Show when={open() && position()}>
        {(position) => (
          <Portal>
            <div
              ref={menu}
              role="menu"
              aria-label={props.label}
              tabIndex={-1}
              class="tool-appear fixed z-[var(--z-dialog)] m-0 flex max-h-[min(24rem,50dvh)] flex-col overflow-auto rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-secondary)] p-1 shadow-[var(--shadow-pop)]"
              style={{
                top: `${position().top}px`,
                left: `${position().left}px`,
                "min-width": `${position().minWidth}px`,
              }}
              onKeyDown={onMenuKeyDown}
            >
              <For each={props.items}>
                {(item) => (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    class="flex min-h-9 w-full shrink-0 items-center justify-start gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-1 text-left text-[var(--fs-control)] text-[var(--text-secondary)] outline-none transition-[background-color,color] duration-[var(--motion-fast)] ease-[var(--motion-ease-standard)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] focus-visible:bg-[var(--bg-tertiary)] focus-visible:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-[var(--opacity-disabled)]"
                    onClick={() => {
                      if (item.disabled) return;
                      closeMenu(false);
                      props.onSelect(item);
                    }}
                  >
                    <Show when={item.icon}>
                      <span class="flex w-4 shrink-0 items-center justify-center">{item.icon}</span>
                    </Show>
                    <span class="truncate">{item.label}</span>
                  </button>
                )}
              </For>
            </div>
          </Portal>
        )}
      </Show>
    </div>
  );
}
