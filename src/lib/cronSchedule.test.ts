import { describe, expect, it } from "vitest";
import { parseCronExpression } from "./cron";
import { buildCronScheduleSummary, describeCronSchedule } from "./cronSchedule";

describe("cron schedules", () => {
  it("humanizes steps and names the selected timezone", () => {
    const parsed = parseCronExpression("*/15 * * * *");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(describeCronSchedule(parsed.value, "utc")).toBe("Every 15 minutes using UTC");
    expect(describeCronSchedule(parsed.value, "local")).toBe("Every 15 minutes using local time");
  });

  it("builds a weekday description and the next two runs", () => {
    expect(
      buildCronScheduleSummary("30 9 * * 1", {
        start: new Date("2024-01-01T08:45:00Z"),
        count: 2,
        timeZone: "utc",
      })
    ).toEqual({
      ok: true,
      description: "At 09:30 on Monday using UTC",
      nextRuns: [new Date("2024-01-01T09:30:00Z"), new Date("2024-01-08T09:30:00Z")],
    });
  });

  it("returns parser errors for invalid expressions", () => {
    expect(
      buildCronScheduleSummary("* * *", {
        start: new Date("2024-01-01T00:00:00Z"),
        count: 3,
        timeZone: "utc",
      })
    ).toEqual({
      ok: false,
      error: { field: "expression", message: "Cron expressions must contain exactly five fields." },
    });
  });
});
