import { fireEvent, render, screen } from "@solidjs/testing-library";
import { expect, it } from "vitest";
import Tool from "./Tool";

it("switches conversion directions and reports invalid rows", () => {
  const { container } = render(() => <Tool />);
  fireEvent.input(screen.getByLabelText("Source"), { target: { value: "a,b\n1,2,3" } });
  expect(screen.getByText("Every row must have the same number of columns.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Markdown to CSV" }));
  fireEvent.input(screen.getByLabelText("Source"), {
    target: { value: "| a | b |\n| --- | --- |\n| 1 | 2 |" },
  });
  expect(container.querySelector("pre")).toHaveTextContent("a,b 1,2");
});
