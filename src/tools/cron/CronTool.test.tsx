import { fireEvent, render } from "@solidjs/testing-library";
import { expect, it } from "vitest";
import CronTool from "./CronTool";

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
  expect(getByRole("alert").style.color).toBe("var(--accent-error)");
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
