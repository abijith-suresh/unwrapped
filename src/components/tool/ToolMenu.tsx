import { createSignal, For, type JSX, onCleanup, Show } from "solid-js";
import { TOOL_ACTION_CLASSES } from "@/components/ToolActionButton";
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

/**
 * A popover menu button. Replaces native <select>-based menus: our own themed
 * surface, keyboard navigation, Escape/backdrop close, and focus return. The
 * menu opens from the bottom edge like every dropdown in the kit and animates
 * in with the shared tool-appear recipe (idle under prefers-reduced-motion).
 */
export default function ToolMenu(props: ToolMenuProps) {
  const [open, setOpen] = createSignal(false);
  let trigger: HTMLButtonElement | undefined;
  let menu: HTMLDivElement | undefined;
  let outsidePointer = false;

  const focusItem = (index: number) => {
    const options = menu?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)');
    if (!options?.length) return;
    const bounded = Math.max(0, Math.min(index, options.length - 1));
    options[bounded]?.focus();
  };

  function openMenu(initialFocus: "first" | "last" = "first") {
    setOpen(true);
    requestAnimationFrame(() => {
      focusItem(initialFocus === "first" ? 0 : Number.MAX_SAFE_INTEGER);
    });
  }

  function closeMenu(returnFocus = true) {
    setOpen(false);
    outsidePointer = false;
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
        setOpen(false);
        outsidePointer = false;
        break;
      default:
        break;
    }
  }

  function onDocumentKeyDown(event: KeyboardEvent) {
    if (!open() || event.key !== "Escape") return;
    closeMenu();
  }
  document.addEventListener("keydown", onDocumentKeyDown);
  onCleanup(() => document.removeEventListener("keydown", onDocumentKeyDown));

  return (
    <div class="relative inline-flex">
      <button
        ref={trigger}
        type="button"
        class={cn(
          TOOL_ACTION_CLASSES.secondary,
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
      <Show when={open()}>
        <div
          ref={menu}
          role="menu"
          aria-label={props.label}
          tabIndex={-1}
          class="tool-appear absolute right-0 top-[calc(100%+0.375rem)] z-[var(--z-overlay)] m-0 flex max-h-[min(24rem,50dvh)] min-w-max flex-col overflow-auto rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-secondary)] p-1 shadow-[var(--shadow-pop)]"
          onPointerDown={(event) => {
            outsidePointer = event.target === menu;
          }}
          onPointerUp={(event) => {
            if (outsidePointer && event.target === menu) closeMenu(false);
            outsidePointer = false;
          }}
          onKeyDown={onMenuKeyDown}
        >
          <For each={props.items}>
            {(item) => (
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                class="flex min-h-9 w-full shrink-0 items-center justify-start gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-1 text-left text-[var(--fs-control)] text-[var(--text-secondary)] outline-none transition-[background-color,color] duration-[var(--motion-fast)] ease-[var(--motion-ease-standard)] focus-visible:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] focus-visible:bg-[var(--bg-tertiary)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-[var(--opacity-disabled)]"
                onClick={() => {
                  if (item.disabled) return;
                  closeMenu();
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
      </Show>
    </div>
  );
}
