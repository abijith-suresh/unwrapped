import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import JsonFormatter from "./JsonFormatter";

describe("JsonFormatter", () => {
  it("applies sorting independently of the output format", () => {
    const { container, getByRole } = render(() => <JsonFormatter />);
    fireEvent.input(getByRole("textbox", { name: "JSON document" }), {
      target: { value: '{"z":1,"a":2}' },
    });
    fireEvent.click(getByRole("radio", { name: "Minified" }));
    fireEvent.click(getByRole("button", { name: "Sort keys A-Z" }));
    expect(container.querySelector("pre")?.textContent).toBe('{"a":2,"z":1}');
    fireEvent.click(getByRole("radio", { name: "4 spaces" }));
    expect(container.querySelector("pre")?.textContent).toBe('{\n    "a": 2,\n    "z": 1\n}');
  });
  it("links a persistent parse error to the input and recovers after editing", () => {
    const { container, getByRole, queryByRole } = render(() => <JsonFormatter />);
    const editor = getByRole("textbox", { name: "JSON document" });
    fireEvent.input(editor, { target: { value: '{"name":' } });
    const alert = getByRole("alert");
    expect(alert).toHaveTextContent("Check line");
    expect(editor).toHaveAttribute("aria-describedby", alert.id);
    expect(container.querySelector("[data-tool-error-marker]")).toBeInTheDocument();
    fireEvent.input(editor, { target: { value: '{"name":"Ada"}' } });
    expect(queryByRole("alert")).not.toBeInTheDocument();
    expect(editor).not.toHaveAttribute("aria-invalid");
    expect(getByRole("button", { name: "Copy JSON" })).toBeEnabled();
  });
});
