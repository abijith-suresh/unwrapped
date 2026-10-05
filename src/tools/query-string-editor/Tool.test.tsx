import { fireEvent, render } from "@solidjs/testing-library";
import { expect, it } from "vitest";
import Tool from "./Tool";

it("adds user parameters without copying examples and edits duplicate rows independently", () => {
  const { getByRole, getByLabelText, getAllByRole } = render(() => <Tool />);
  fireEvent.click(getByRole("button", { name: "Add parameter" }));
  expect(getByLabelText("Key 1")).toHaveValue("");
  expect(getByLabelText("Value 1")).toHaveValue("");
  fireEvent.input(getByLabelText("Key 1"), { target: { value: "q" } });
  fireEvent.input(getByLabelText("Value 1"), { target: { value: "Ada + Bob" } });
  expect(getByRole("region", { name: "Encoded result" })).toHaveTextContent("q=Ada+%2B+Bob");

  fireEvent.input(getByLabelText("URL or query string"), {
    target: { value: "/path?tag=one&tag=two#frag" },
  });
  fireEvent.input(getByLabelText("Value 2"), { target: { value: "three" } });
  expect(getByRole("region", { name: "Encoded result" })).toHaveTextContent(
    "/path?tag=one&tag=three#frag"
  );
  fireEvent.click(getByRole("button", { name: "Clear inputs" }));
  expect(getByLabelText("URL or query string")).toHaveValue("");
  expect(getAllByRole("textbox")).toHaveLength(1);
});
