import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import ToolCodeBlock from "./ToolCodeBlock";

describe("ToolCodeBlock", () => {
  it("renders highlight segments as text nodes and fixed marks", () => {
    const { container } = render(() => (
      <ToolCodeBlock
        segments={[
          { text: "<script>", kind: "plain" },
          { text: "</mark>", kind: "match" },
          { text: "\nline", kind: "plain" },
        ]}
      />
    ));

    const pre = container.querySelector("pre");
    expect(pre?.textContent).toBe("<script></mark>\nline");
    expect(pre?.querySelector("script")).toBeNull();
    expect(pre?.querySelector("mark")?.textContent).toBe("</mark>");
  });

  it("renders fallback children when no segments are provided", () => {
    const { container } = render(() => <ToolCodeBlock>plain output</ToolCodeBlock>);

    expect(container.querySelector("pre")).toHaveTextContent("plain output");
  });
});
