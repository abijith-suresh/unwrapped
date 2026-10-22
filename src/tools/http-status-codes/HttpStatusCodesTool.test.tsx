import { fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, expect, it, vi } from "vitest";
import HttpStatusCodesTool from "./HttpStatusCodesTool";

afterEach(() => vi.restoreAllMocks());

it("shows the full reference, filters by category and reports an empty state", () => {
  const request = vi.spyOn(globalThis, "fetch");
  render(() => <HttpStatusCodesTool />);
  expect(screen.getByText("62 entries shown")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("radio", { name: "Successful" }));
  expect(screen.getByText("10 entries shown")).toBeInTheDocument();
  expect(screen.queryByText("Not Found")).toBeNull();

  fireEvent.click(screen.getByRole("radio", { name: "All" }));
  fireEvent.input(screen.getByLabelText("Search by code or name"), {
    target: { value: "teapot" },
  });
  expect(screen.getByText("418")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("radio", { name: "Server Error" }));
  expect(screen.getByText("No matching entries.")).toBeInTheDocument();
  expect(request).not.toHaveBeenCalled();
});
