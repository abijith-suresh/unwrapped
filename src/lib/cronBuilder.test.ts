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
  it("rejects empty or injected fields", () => {
    const fields = cronFields("* * * * *");
    expect(buildCron({ ...fields, minute: "" }).ok).toBe(false);
    expect(buildCron({ ...fields, minute: "0 1" }).ok).toBe(false);
    expect(() => cronFields("bad")).toThrow();
  });
});
