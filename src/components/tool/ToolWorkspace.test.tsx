import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import ToolWorkspace from "./ToolWorkspace";

const VIEWS = [
  { id: "input", label: "Input", content: <div>input content</div> },
  { id: "output", label: "Output", content: <div>output content</div> },
] as const;

describe("ToolWorkspace", () => {
  it("selects the initial view and switches its tabpanel", () => {
    const { getByRole, getByText } = render(() => (
      <ToolWorkspace views={VIEWS} switcherLabel="Formatter views" />
    ));

    const inputTab = getByRole("tab", { name: "Input" });
    const outputTab = getByRole("tab", { name: "Output" });
    expect(inputTab).toHaveAttribute("aria-selected", "true");
    expect(outputTab).toHaveAttribute("aria-selected", "false");
    const inputPanel = getByRole("tabpanel", { name: "Input" });
    const outputPanel = getByRole("tabpanel", { name: "Output" });
    expect(inputPanel.style.display).toBe("block");
    expect(outputPanel.style.display).toBe("");
    expect(getByText("input content")).toBeInTheDocument();
    expect(getByText("output content")).toBeInTheDocument();

    fireEvent.click(outputTab);
    expect(inputTab).toHaveAttribute("aria-selected", "false");
    expect(outputTab).toHaveAttribute("aria-selected", "true");
    expect(inputPanel.style.display).toBe("");
    expect(outputPanel.style.display).toBe("block");
  });

  it("supports arrow-key navigation across view tabs", () => {
    const { getByRole } = render(() => <ToolWorkspace views={VIEWS} />);
    const inputTab = getByRole("tab", { name: "Input" });
    const outputTab = getByRole("tab", { name: "Output" });

    inputTab.focus();
    fireEvent.keyDown(inputTab, { key: "ArrowRight" });

    expect(document.activeElement).toBe(outputTab);
    expect(outputTab).toHaveAttribute("aria-selected", "true");
  });
});
