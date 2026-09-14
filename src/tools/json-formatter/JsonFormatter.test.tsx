import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import JsonFormatter from "./JsonFormatter";

describe("JsonFormatter", () => {
  it("formats input inside the shared tool layout", async () => {
    const { container, getByRole } = render(() => <JsonFormatter />);

    expect(getByRole("textbox", { name: "JSON document" })).toBeInTheDocument();
    expect(getByRole("heading", { name: "Input" })).toBeInTheDocument();

    fireEvent.input(getByRole("textbox", { name: "JSON document" }), {
      target: { value: '{"name":"Ada"}' },
    });

    await waitFor(() => expect(container.querySelector("pre")).toHaveTextContent('"name": "Ada"'));
    expect(getByRole("button", { name: "Copy JSON" })).toBeInTheDocument();
  });

  it("keeps indentation and formatting modes visibly selected", () => {
    const { getByRole } = render(() => <JsonFormatter />);

    const twoSpaces = getByRole("radio", { name: "2 spaces" });
    const fourSpaces = getByRole("radio", { name: "4 spaces" });
    const minified = getByRole("radio", { name: "Minified" });

    expect(twoSpaces).toHaveAttribute("aria-checked", "true");
    expect(fourSpaces).toHaveAttribute("aria-checked", "false");
    expect(minified).toHaveAttribute("aria-checked", "false");

    fireEvent.click(fourSpaces);
    expect(twoSpaces).toHaveAttribute("aria-checked", "false");
    expect(fourSpaces).toHaveAttribute("aria-checked", "true");

    fireEvent.click(minified);
    expect(minified).toHaveAttribute("aria-checked", "true");
    expect(fourSpaces).toHaveAttribute("aria-checked", "false");
  });

  it("keeps sort keys independent from the output format", () => {
    const { getByRole, queryByRole } = render(() => <JsonFormatter />);

    const minified = getByRole("radio", { name: "Minified" });
    const fourSpaces = getByRole("radio", { name: "4 spaces" });
    const sortKeys = getByRole("button", { name: "Sort keys A-Z" });

    fireEvent.click(minified);
    fireEvent.click(sortKeys);

    expect(minified).toHaveAttribute("aria-checked", "true");
    expect(sortKeys).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(fourSpaces);

    expect(fourSpaces).toHaveAttribute("aria-checked", "true");
    expect(sortKeys).toHaveAttribute("aria-pressed", "true");
    expect(queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("switches between input and output views for compact mobile use", () => {
    const { getByRole } = render(() => <JsonFormatter />);

    const inputView = getByRole("button", { name: "Input" });
    const outputView = getByRole("button", { name: "Output" });

    expect(inputView).toHaveAttribute("aria-pressed", "true");
    expect(outputView).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(outputView);

    expect(inputView).toHaveAttribute("aria-pressed", "false");
    expect(outputView).toHaveAttribute("aria-pressed", "true");
  });

  it("shows an accessible toast and persistent inline diagnostic", async () => {
    const { container, getByRole } = render(() => <JsonFormatter />);

    fireEvent.input(getByRole("textbox", { name: "JSON document" }), {
      target: { value: '{"name":' },
    });

    await waitFor(() => {
      expect(getByRole("status")).toHaveTextContent("JSON could not be parsed.");
    });
    expect(container.querySelector("[data-json-error-marker]")).toBeInTheDocument();
    expect(container.querySelector("details")).not.toBeInTheDocument();
    expect(getByRole("textbox", { name: "JSON document" })).toHaveAttribute(
      "aria-describedby",
      "json-input-error"
    );
  });
});
