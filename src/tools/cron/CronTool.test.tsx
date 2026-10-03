import { fireEvent, render } from "@solidjs/testing-library";
import { expect, it } from "vitest";
import CronTool from "./CronTool";

it("rejects an invalid expression and recovers to the entered schedule", () => {
  const { getByRole, queryByRole, getByText } = render(() => <CronTool />);
  const expression = getByRole("textbox", { name: "Cron expression" });

  fireEvent.click(getByRole("radio", { name: "UTC" }));
  fireEvent.input(expression, { target: { value: "invalid" } });
  expect(getByRole("alert")).toHaveTextContent(
    "Cron expressions must contain exactly five fields."
  );
  expect(expression).toHaveAttribute("aria-invalid", "true");
  expect(queryByRole("note", { name: "Example output" })).not.toBeInTheDocument();

  fireEvent.input(expression, { target: { value: "0 12 * * *" } });
  expect(queryByRole("alert")).not.toBeInTheDocument();
  expect(expression).not.toHaveAttribute("aria-invalid", "true");
  expect(getByText("At 12:00 every day using UTC")).toBeInTheDocument();
});

it("previews edited builder fields and recovers from validation errors", () => {
  const { getByRole } = render(() => <CronTool />);
  const expression = getByRole("textbox", { name: "Cron expression" });
  const minute = getByRole("textbox", { name: "Minute (0-59)" });
  const preview = getByRole("button", { name: "Preview built schedule" });

  fireEvent.click(getByRole("button", { name: "Every 5 minutes" }));
  expect(expression).toHaveValue("*/5 * * * *");
  expect(minute).toHaveValue("*/5");
  fireEvent.input(minute, { target: { value: "60" } });
  expect(preview).toBeDisabled();
  expect(getByRole("alert")).toHaveTextContent("Minute must be between 0 and 59.");
  expect(getByRole("button", { name: "Copy built expression" })).toBeDisabled();

  fireEvent.input(minute, { target: { value: "15" } });
  fireEvent.input(getByRole("textbox", { name: "Hour (0-23)" }), { target: { value: "9" } });
  fireEvent.click(preview);
  expect(expression).toHaveValue("15 9 * * *");
  expect(getByRole("button", { name: "Copy built expression" })).toBeEnabled();

  fireEvent.input(expression, { target: { value: "10,20 7 * 1 1-5" } });
  fireEvent.click(getByRole("button", { name: "Load expression into builder" }));
  expect(minute).toHaveValue("10,20");
  expect(getByRole("textbox", { name: "Hour (0-23)" })).toHaveValue("7");
  expect(getByRole("textbox", { name: "Day of week (0-6)" })).toHaveValue("1-5");
});
