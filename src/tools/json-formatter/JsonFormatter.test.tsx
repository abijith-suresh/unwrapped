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

    const twoSpaces = getByRole("button", { name: "2 spaces" });
    const fourSpaces = getByRole("button", { name: "4 spaces" });
    const minify = getByRole("button", { name: "Minify" });

    expect(twoSpaces).toHaveAttribute("aria-pressed", "true");
    expect(fourSpaces).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(fourSpaces);
    expect(twoSpaces).toHaveAttribute("aria-pressed", "false");
    expect(fourSpaces).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(minify);
    expect(minify).toHaveAttribute("aria-pressed", "true");
    expect(fourSpaces).toHaveAttribute("aria-pressed", "false");
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

  it("shows a compact accessible error with optional details", async () => {
    const { container, getByRole, getByText } = render(() => <JsonFormatter />);

    fireEvent.input(getByRole("textbox", { name: "JSON document" }), {
      target: { value: '{"name":' },
    });

    await waitFor(() => {
      expect(getByRole("alert")).toHaveTextContent("JSON could not be parsed");
    });
    expect(getByText("Show error details")).toBeInTheDocument();
    expect(container.querySelector("details")).not.toHaveAttribute("open");
    expect(getByRole("textbox", { name: "JSON document" })).toHaveAttribute(
      "aria-describedby",
      "json-input-error"
    );
  });
});
