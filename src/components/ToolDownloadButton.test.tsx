import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import ToolDownloadButton from "./ToolDownloadButton";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("output download lifecycle", () => {
  it("attaches a real download link, removes it and releases the URL after dispatch", () => {
    vi.useFakeTimers();
    const create = vi.fn(() => "blob:local-output");
    const revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      expect(this.isConnected).toBe(true);
      expect(this.download).toBe("output.json");
      expect(this.href).toBe("blob:local-output");
    });
    const { getByRole } = render(() => <ToolDownloadButton value='{"id":1}' format="json" />);
    fireEvent.click(getByRole("button", { name: "Download output" }));
    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector("a[download]")).toBeNull();
    expect(revoke).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(revoke).toHaveBeenCalledWith("blob:local-output");
  });

  it("announces a failed download and still releases the URL", () => {
    vi.useFakeTimers();
    const revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: () => "blob:failed", revokeObjectURL: revoke });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      throw new Error("Blocked");
    });
    const { getByRole } = render(() => <ToolDownloadButton value="content" />);
    fireEvent.click(getByRole("button", { name: "Download output" }));
    expect(getByRole("status")).toHaveTextContent("Could not download");
    expect(document.querySelector("a[download]")).toBeNull();
    vi.advanceTimersByTime(1000);
    expect(revoke).toHaveBeenCalledOnce();
  });
});
