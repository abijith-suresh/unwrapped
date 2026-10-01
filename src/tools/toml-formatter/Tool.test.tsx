import { fireEvent, render, screen } from "@solidjs/testing-library";
import { expect, it } from "vitest";
import Tool from "./Tool";

it("reports invalid TOML and recovers when the source is corrected", () => {
  const { container } = render(() => <Tool />);
  const source = screen.getByLabelText("Source");
  fireEvent.input(source, { target: { value: "x = 1\nx = 2" } });
  expect(source).toHaveAttribute("aria-invalid", "true");
  expect(container.querySelector("pre")).toBeNull();
  fireEvent.input(source, { target: { value: "x=2" } });
  expect(source).not.toHaveAttribute("aria-invalid");
  expect(container.querySelector("pre")).toHaveTextContent("x = 2");
  fireEvent.click(screen.getByRole("button", { name: "Clear input" }));
  expect(source).toHaveValue("");
});
