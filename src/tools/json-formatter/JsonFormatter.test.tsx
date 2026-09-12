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

  it("shows an accessible error panel for invalid JSON", async () => {
    const { getByRole } = render(() => <JsonFormatter />);

    fireEvent.input(getByRole("textbox", { name: "JSON document" }), {
      target: { value: '{"name":' },
    });

    await waitFor(() => {
      expect(getByRole("alert", { name: "Input error" })).toHaveTextContent("JSON parse error");
    });
    expect(getByRole("textbox", { name: "JSON document" })).toHaveAttribute(
      "aria-describedby",
      "json-input-error"
    );
  });
});
