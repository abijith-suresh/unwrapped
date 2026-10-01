import { fireEvent, render, screen } from "@solidjs/testing-library";
import { expect, it } from "vitest";
import Tool from "./Tool";

it("minifies styles as text without applying them to the page", () => {
  const { container } = render(() => <Tool />);
  fireEvent.input(screen.getByLabelText("Source"), {
    target: { value: "body { display: none; }" },
  });
  expect(container.querySelector("pre")).toHaveTextContent("body{display:none}");
  expect(container.querySelector("style")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Clear input" }));
  expect(screen.getByLabelText("Source")).toHaveValue("");
});
