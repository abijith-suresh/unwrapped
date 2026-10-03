import { fireEvent, render } from "@solidjs/testing-library";
import { expect, it } from "vitest";
import UrlInspectorTool from "./UrlInspectorTool";

it("replaces the example with parsed user data and clears stale results on invalid input", () => {
  const { container, getByRole, queryByRole } = render(() => <UrlInspectorTool />);
  const input = getByRole("textbox", { name: "URL or raw query string" });

  fireEvent.input(input, { target: { value: "https://example.net/?q=Ada%20%2B%20Bob" } });
  expect(getByRole("region", { name: "Hostname" })).toHaveTextContent("example.net");
  expect(getByRole("table")).toHaveTextContent("Ada + Bob");
  expect(queryByRole("note", { name: "Example output" })).not.toBeInTheDocument();

  fireEvent.input(input, { target: { value: "https://[" } });
  expect(getByRole("alert")).toHaveTextContent("Enter a full URL or a raw query string.");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(container).not.toHaveTextContent("example.net");
  expect(queryByRole("table")).not.toBeInTheDocument();

  fireEvent.input(input, { target: { value: "q=Grace" } });
  expect(queryByRole("alert")).not.toBeInTheDocument();
  expect(input).not.toHaveAttribute("aria-invalid", "true");
  expect(getByRole("table")).toHaveTextContent("Grace");
});
