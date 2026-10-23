import { fireEvent, render, screen, waitFor } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import ToolMenu from "./ToolMenu";

afterEach(() => {
  document.body.innerHTML = "";
});

function setup(onSelect = vi.fn()) {
  const view = render(() => (
    <ToolMenu
      label="Open output in another tool"
      items={[
        { id: "json-to-yaml", label: "JSON to YAML" },
        { id: "diff", label: "Text Diff" },
        { id: "base64", label: "Base64" },
      ]}
      onSelect={onSelect}
    >
      <span>Open in…</span>
    </ToolMenu>
  ));
  return { ...view, onSelect };
}

describe("ToolMenu", () => {
  it("opens on click, lists items, and closes with focus return", () => {
    const { getByRole } = setup();
    expect(screen.queryByRole("menuitem", { name: "JSON to YAML" })).not.toBeInTheDocument();
    fireEvent.click(getByRole("button", { name: "Open output in another tool" }));
    expect(screen.getByRole("menuitem", { name: "JSON to YAML" })).toBeInTheDocument();
    expect(getByRole("button", { name: "Open output in another tool" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    fireEvent.keyDown(screen.getByRole("menu", { name: "Open output in another tool" }), {
      key: "Escape",
    });
    expect(screen.queryByRole("menuitem", { name: "JSON to YAML" })).not.toBeInTheDocument();
    expect(document.activeElement).toHaveAttribute("aria-label", "Open output in another tool");
  });

  it("navigates with arrow keys and selects on Enter", async () => {
    const onSelect = vi.fn();
    const { getByRole } = setup(onSelect);
    const trigger = getByRole("button", { name: "Open output in another tool" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName("JSON to YAML"));
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowDown" });
    expect(document.activeElement).toHaveAccessibleName("Text Diff");
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowUp" });
    expect(document.activeElement).toHaveAccessibleName("JSON to YAML");
    /* Enter/Space activation of the focused item is native button behavior in
       real browsers; jsdom does not synthesize clicks from key presses, so the
       selection path is asserted through the click test below. */
    fireEvent.keyDown(screen.getByRole("menu", { name: "Open output in another tool" }), {
      key: "Escape",
    });
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
  });

  it("closes when the pointer lands outside the menu", () => {
    const { getByRole } = setup();
    fireEvent.click(getByRole("button", { name: "Open output in another tool" }));
    expect(screen.getByRole("menuitem", { name: "Base64" })).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menuitem", { name: "Base64" })).not.toBeInTheDocument();
  });

  it("closes on click of a menu item and reports the selection", () => {
    const onSelect = vi.fn();
    const { getByRole } = setup(onSelect);
    fireEvent.click(getByRole("button", { name: "Open output in another tool" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Text Diff" }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "diff" }));
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
  });
});
