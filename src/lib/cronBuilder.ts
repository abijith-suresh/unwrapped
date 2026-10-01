import { type CronFieldName, parseCronExpression, SUPPORTED_CRON_SYNTAX } from "@/lib/cron";
import type { TextTransformResult } from "@/lib/text";
export type CronBuilderFields = Record<CronFieldName, string>;
export const CRON_PRESETS: { label: string; expression: string }[] = [
  { label: "Every 5 minutes", expression: "*/5 * * * *" },
  { label: "Daily at 09:00", expression: "0 9 * * *" },
  { label: "Weekdays at 09:00", expression: "0 9 * * 1-5" },
  { label: "First day of each month", expression: "0 0 1 * *" },
];
export function buildCron(fields: CronBuilderFields): TextTransformResult {
  const values = SUPPORTED_CRON_SYNTAX.fieldOrder.map((field) => fields[field].trim());
  if (values.some((value) => !value || /\s/.test(value)))
    return { ok: false, error: "Each field must contain one cron value without spaces." };
  const output = values.join(" ");
  const parsed = parseCronExpression(output);
  return parsed.ok ? { ok: true, output } : { ok: false, error: parsed.error.message };
}
export function cronFields(expression: string): CronBuilderFields {
  const parsed = parseCronExpression(expression);
  if (!parsed.ok) throw new Error(parsed.error.message);
  return Object.fromEntries(
    SUPPORTED_CRON_SYNTAX.fieldOrder.map((field) => [field, parsed.value[field].raw])
  ) as CronBuilderFields;
}
