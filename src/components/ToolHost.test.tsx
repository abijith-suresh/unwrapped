import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import type { Component } from "solid-js";
import { describe, expect, it, vi } from "vitest";

import ToolHost from "./ToolHost";

const StubTool: Component = () => <div>tool content</div>;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("ToolHost", () => {
  it("renders the skeleton while the tool module loads, then renders the tool", async () => {
    const gate = deferred<Component>();
    const { getByRole, queryByRole, findByText } = render(() => (
      <ToolHost
        componentPath="/src/tools/stub/Stub.tsx"
        toolName="Stub"
        loadModule={() => gate.promise}
      />
    ));

    expect(getByRole("status", { name: "Loading tool" })).toBeInTheDocument();

    gate.resolve(StubTool);
    await findByText("tool content");
    expect(queryByRole("status", { name: "Loading tool" })).not.toBeInTheDocument();
  });

  it("retries the load when the retry button is clicked", async () => {
    const loadModule = vi
      .fn<(path: string) => Promise<Component>>()
      .mockRejectedValueOnce(new Error("network blip"))
      .mockResolvedValueOnce(StubTool);

    const { getByRole, findByText, queryByText } = render(() => (
      <ToolHost componentPath="/src/tools/stub/Stub.tsx" toolName="Stub" loadModule={loadModule} />
    ));

    await findByText("Stub could not be loaded");
    expect(getByRole("alert")).toHaveTextContent("network blip");
    fireEvent.click(getByRole("button", { name: "Retry tool" }));

    await waitFor(() => expect(queryByText("tool content")).toBeInTheDocument());
    expect(loadModule).toHaveBeenCalledTimes(2);
  });

  it("surfaces render-time crashes through the same fallback", async () => {
    const CrashingTool = () => {
      throw new Error("boom");
    };

    const { findByText } = render(() => (
      <ToolHost
        componentPath="/src/tools/stub/Stub.tsx"
        toolName="Stub"
        loadModule={() => Promise.resolve(CrashingTool)}
      />
    ));

    await findByText("Stub could not be loaded");
  });
});
