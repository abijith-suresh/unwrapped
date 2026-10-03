import { describe, expect, it } from "vitest";
import { parseCronExpression } from "./cron";

describe("cron parser", () => {
  it("assigns numeric values to the five fields in order", () => {
    expect(parseCronExpression("5 4 3 2 1")).toEqual({
      ok: true,
      value: {
        minute: { kind: "value", raw: "5", value: 5 },
        hour: { kind: "value", raw: "4", value: 4 },
        dayOfMonth: { kind: "value", raw: "3", value: 3 },
        month: { kind: "value", raw: "2", value: 2 },
        dayOfWeek: { kind: "value", raw: "1", value: 1 },
      },
    });
  });

  it.each([
    { input: "*", expected: { kind: "wildcard", raw: "*" } },
    { input: "1-5", expected: { kind: "range", raw: "1-5", start: 1, end: 5 } },
    {
      input: "*/15",
      expected: { kind: "step", raw: "*/15", base: { kind: "wildcard", raw: "*" }, step: 15 },
    },
    {
      input: "1,15,30",
      expected: {
        kind: "list",
        raw: "1,15,30",
        items: [
          { kind: "value", raw: "1", value: 1 },
          { kind: "value", raw: "15", value: 15 },
          { kind: "value", raw: "30", value: 30 },
        ],
      },
    },
    {
      input: "1-10/2",
      expected: {
        kind: "step",
        raw: "1-10/2",
        base: { kind: "range", raw: "1-10", start: 1, end: 10 },
        step: 2,
      },
    },
  ])("parses minute syntax $input", ({ input, expected }) => {
    expect(parseCronExpression(`${input} * * * *`)).toMatchObject({
      ok: true,
      value: { minute: expected },
    });
  });

  it.each([
    {
      input: "* * * *",
      field: "expression",
      message: "Cron expressions must contain exactly five fields.",
    },
    { input: "60 * * * *", field: "minute", message: "Minute must be between 0 and 59." },
    { input: "* * * * 7", field: "dayOfWeek", message: "Day of week must be between 0 and 6." },
    { input: "*/0 * * * *", field: "minute", message: "Minute step must be greater than 0." },
    {
      input: "10-1 * * * *",
      field: "minute",
      message: "Minute range start must be less than or equal to the end.",
    },
    { input: "* * * JAN MON", field: "month", message: "Month contains unsupported syntax." },
  ])("rejects $input with a field-specific error", ({ input, field, message }) => {
    expect(parseCronExpression(input)).toEqual({ ok: false, error: { field, message } });
  });
});
