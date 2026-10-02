import { fireEvent, render, screen } from "@solidjs/testing-library";
import { expect, it } from "vitest";
import Tool from "./Tool";

it("renders decoded markup as inert text", () => {
  const { container } = render(() => <Tool />);
  fireEvent.click(screen.getByRole("radio", { name: "Decode" }));
  fireEvent.input(screen.getByLabelText("Source"), {
    target: { value: "&lt;img src=x onerror=alert(1)&gt;" },
  });
  expect(container.querySelector("pre")).toHaveTextContent("<img src=x onerror=alert(1)>");
  expect(container.querySelector("img")).toBeNull();
  fireEvent.click(screen.getByRole("radio", { name: "Encode" }));
  expect(container.querySelector("pre")).toHaveTextContent("&amp;lt;");
});
