import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import ToolCodeEditor from "./ToolCodeEditor";

describe("ToolCodeEditor", () => {
  it("keeps generated controls associated with their labels", () => {
    const { getByRole } = render(() => <ToolCodeEditor label="Source code" name="source" />);
    const editor = getByRole("textbox", { name: "Source code" });
    const label = document.querySelector(`label[for="${editor.id}"]`);

    expect(editor.id).not.toBe("");
    expect(label).toBeInTheDocument();
    expect(editor).toHaveAttribute("name", "source");
  });

  it("forwards native textarea attributes and renders a generic diagnostic marker", () => {
    const { container, getByRole } = render(() => (
      <ToolCodeEditor
        label="Source code"
        value='{"name":'
        diagnostic={{ start: 8, length: 1 }}
        required
        spellcheck={false}
      />
    ));
    const editor = getByRole("textbox", { name: "Source code" });

    expect(editor).toBeRequired();
    expect(editor).toHaveAttribute("spellcheck", "false");
    expect(container.querySelector("[data-tool-error-marker]")).toBeInTheDocument();
  });

  it("keeps the diagnostic layer aligned while the editor scrolls", () => {
    const { container, getByRole } = render(() => (
      <ToolCodeEditor
        label="Source code"
        value={`{"message":"${"long value ".repeat(12)}"}`}
        diagnostic={{ start: 12, length: 1 }}
      />
    ));
    const editor = getByRole("textbox", { name: "Source code" });
    const highlightLayer = container.querySelector("pre");

    Object.defineProperties(editor, {
      scrollLeft: { configurable: true, value: 8 },
      scrollTop: { configurable: true, value: 24 },
    });
    editor.dispatchEvent(new Event("scroll", { bubbles: true }));

    expect(highlightLayer).toHaveStyle("transform: translate(-8px, -24px)");
  });
});
