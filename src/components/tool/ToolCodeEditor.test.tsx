import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import ToolCodeEditor from "./ToolCodeEditor";

describe("ToolCodeEditor", () => {
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
