import { describe, expect, it } from "vitest";
import { buildCron, CRON_PRESETS, cronFields } from "./cronBuilder";

describe("cron builder", () => {
  it("round trips every preset", () => {
    for (const preset of CRON_PRESETS)
      expect(buildCron(cronFields(preset.expression))).toEqual({
        ok: true,
        output: preset.expression,
      });
  });
  it("validates ranges, steps and field boundaries", () => {
    const fields = cronFields("*/5 9 * * 1-5");
    expect(buildCron({ ...fields, minute: "60" }).ok).toBe(false);
    expect(buildCron({ ...fields, minute: "*/0" }).ok).toBe(false);
    expect(buildCron({ ...fields, dayOfWeek: "7" }).ok).toBe(false);
    expect(buildCron({ ...fields, month: "12-1" }).ok).toBe(false);
  });
  it("rejects empty or injected fields", () => {
    const fields = cronFields("* * * * *");
    expect(buildCron({ ...fields, minute: "" }).ok).toBe(false);
    expect(buildCron({ ...fields, minute: "0 1" }).ok).toBe(false);
    expect(() => cronFields("bad")).toThrow();
  });
});
