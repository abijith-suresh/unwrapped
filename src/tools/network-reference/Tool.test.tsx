import { fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, expect, it, vi } from "vitest";
import Tool from "./Tool";

afterEach(() => vi.restoreAllMocks());

it("filters bundled entries and shows an empty state without requests", () => {
  const request = vi.spyOn(globalThis, "fetch");
  render(() => <Tool />);
  fireEvent.click(screen.getByRole("radio", { name: "DNS records" }));
  fireEvent.input(screen.getByLabelText("Search record types or headers"), {
    target: { value: "IPv6" },
  });
  expect(screen.getByRole("region", { name: "AAAA" })).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Content-Type" })).toBeNull();
  fireEvent.click(screen.getByRole("radio", { name: "HTTP headers" }));
  expect(screen.getByText("No matching entries.")).toBeInTheDocument();
  expect(request).not.toHaveBeenCalled();
});
