import { fireEvent, render } from "@solidjs/testing-library";
import { expect, it, vi } from "vitest";
import TimestampTool from "./TimestampTool";

it("preserves a local datetime through unit changes, epoch edits, errors, now and reset", () => {
  const view = render(() => <TimestampTool />);
  const epoch = view.getByRole("textbox", { name: "Unix timestamp" });
  const datetime = view.getByLabelText("Date & time (local)");
  const ms = new Date(2024, 0, 2, 3, 4, 5, 123).getTime();
  const iso = new Date(ms).toISOString();

  fireEvent.input(datetime, { target: { value: "2024-01-02T03:04:05.123" } });
  expect(epoch).toHaveValue(String(ms / 1000));
  expect(view.getAllByRole("button", { name: "Copy ISO 8601" })).toHaveLength(1);
  expect(view.container).toHaveTextContent(iso);
  fireEvent.click(view.getByRole("radio", { name: "Milliseconds" }));
  expect(epoch).toHaveValue(String(ms));
  expect(datetime).toHaveValue("2024-01-02T03:04:05.123");
  fireEvent.input(epoch, { target: { value: String(ms + 1) } });
  expect(datetime).toHaveValue("2024-01-02T03:04:05.124");
  fireEvent.input(datetime, { target: { value: "2024-01-02T03:04:05.123" } });
  fireEvent.click(view.getByRole("radio", { name: "Seconds" }));
  expect(epoch).toHaveValue(String(ms / 1000));
  fireEvent.input(epoch, { target: { value: String(ms / 1000) } });
  expect(datetime).toHaveValue("2024-01-02T03:04:05.123");
  expect(view.container).toHaveTextContent(iso);

  for (const invalid of ["0x10", "8640000000000.001", "1.0001"]) {
    fireEvent.input(epoch, { target: { value: invalid } });
    expect(epoch).toHaveAttribute("aria-invalid", "true");
    expect(epoch).toHaveAccessibleDescription(view.getByRole("alert").textContent ?? "");
    expect(view.queryByRole("button", { name: "Copy ISO 8601" })).not.toBeInTheDocument();
  }
  fireEvent.input(epoch, { target: { value: "946684800000" } });
  fireEvent.click(view.getByRole("radio", { name: "Milliseconds" }));
  expect(view.container).toHaveTextContent("2000-01-01T00:00:00.000Z");
  expect(view.queryByRole("alert")).not.toBeInTheDocument();
  fireEvent.input(epoch, { target: { value: "-1" } });
  expect(view.queryByRole("button", { name: "Copy Mongo ObjectID seed" })).not.toBeInTheDocument();
  expect(view.container).toHaveTextContent("1969-12-31T23:59:59.999Z");

  const clock = vi.spyOn(Date, "now").mockReturnValue(ms);
  fireEvent.click(view.getByRole("button", { name: "Use now" }));
  expect(epoch).toHaveValue(String(ms));
  expect(datetime).toHaveValue("2024-01-02T03:04:05.123");
  expect(view.container).toHaveTextContent(iso);
  clock.mockRestore();
  fireEvent.click(view.getByRole("button", { name: "Reset" }));
  expect(epoch).toHaveValue("");
  expect(datetime).toHaveValue("");
  expect(view.getByRole("radio", { name: "Auto" })).toHaveAttribute("aria-checked", "true");
  expect(view.getByRole("note", { name: "Example output" })).toBeInTheDocument();
});
