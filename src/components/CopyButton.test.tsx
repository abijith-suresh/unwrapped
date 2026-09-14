import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/clipboard", () => ({
  copyToClipboard: vi.fn(),
}));

import { copyToClipboard } from "@/lib/clipboard";
import CopyButton from "./CopyButton";

const copyToClipboardMock = vi.mocked(copyToClipboard);

describe("CopyButton", () => {
  it("renders with the default label and copies the given text", async () => {
    copyToClipboardMock.mockResolvedValue(true);
    const { getByRole } = render(() => <CopyButton text="secret value" />);

    const button = getByRole("button", { name: "Copy" });
    fireEvent.click(button);

    await waitFor(() => expect(copyToClipboardMock).toHaveBeenCalledWith("secret value"));
    expect(getByRole("button", { name: "Copy" })).toHaveTextContent("Copied");
    expect(getByRole("status")).toHaveTextContent("Copied content to the clipboard.");
  });

  it("explains when the clipboard write fails and keeps the action available", async () => {
    copyToClipboardMock.mockResolvedValue(false);
    const { getByRole } = render(() => <CopyButton text="value" label="Copy hash" />);

    fireEvent.click(getByRole("button", { name: "Copy hash" }));

    await waitFor(() => expect(copyToClipboardMock).toHaveBeenCalled());
    expect(getByRole("button", { name: "Copy hash" })).toBeInTheDocument();
    expect(getByRole("button", { name: "Copy hash" })).toHaveTextContent("Copy failed");
    expect(getByRole("status")).toHaveTextContent("Could not copy hash. Try again.");
  });

  it("resets the copied state after the feedback window", async () => {
    vi.useFakeTimers();
    copyToClipboardMock.mockResolvedValue(true);
    const { getByRole } = render(() => <CopyButton text="value" />);
    fireEvent.click(getByRole("button", { name: "Copy" }));

    await vi.advanceTimersByTimeAsync(0);
    expect(getByRole("button", { name: "Copy" })).toHaveTextContent("Copied");

    await vi.advanceTimersByTimeAsync(2000);
    expect(getByRole("button", { name: "Copy" })).toBeInTheDocument();

    vi.useRealTimers();
  });
});
