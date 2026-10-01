import { fireEvent, render, screen } from "@solidjs/testing-library";
import { expect, it } from "vitest";
import { EXAMPLE_JSON_SCHEMA, EXAMPLE_SCHEMA_DOCUMENT } from "@/lib/exampleData";
import Tool from "./Tool";

it("validates on request and clears stale results after edits", () => {
  render(() => <Tool />);
  fireEvent.input(screen.getByLabelText("JSON"), { target: { value: EXAMPLE_SCHEMA_DOCUMENT } });
  fireEvent.input(screen.getByLabelText("Draft-07 schema"), {
    target: { value: EXAMPLE_JSON_SCHEMA },
  });
  fireEvent.click(screen.getByRole("button", { name: "Validate document" }));
  expect(screen.getByText("Valid. The document matches the schema.")).toBeInTheDocument();
  fireEvent.input(screen.getByLabelText("JSON"), { target: { value: "{}" } });
  expect(screen.queryByText("Valid. The document matches the schema.")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Validate document" }));
  expect(screen.getByText(/must have required property 'name'/)).toBeInTheDocument();
  fireEvent.input(screen.getByLabelText("Draft-07 schema"), { target: { value: "{" } });
  fireEvent.click(screen.getByRole("button", { name: "Validate document" }));
  expect(screen.getByText("Invalid schema JSON.")).toBeInTheDocument();
});
