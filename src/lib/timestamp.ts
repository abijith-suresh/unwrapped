export interface TimeZoneOption {
  label: string;
  tz: string;
}

export interface DerivedTimestampFormat {
  label: string;
  value: string;
}

export const DEFAULT_ZONES: TimeZoneOption[] = [
  { label: "UTC", tz: "UTC" },
  { label: "US/Eastern", tz: "America/New_York" },
  { label: "US/Pacific", tz: "America/Los_Angeles" },
];

export const PRESET_ZONES: TimeZoneOption[] = [
  { label: "UTC", tz: "UTC" },
  { label: "US/Eastern", tz: "America/New_York" },
  { label: "US/Central", tz: "America/Chicago" },
  { label: "US/Mountain", tz: "America/Denver" },
  { label: "US/Pacific", tz: "America/Los_Angeles" },
  { label: "London", tz: "Europe/London" },
  { label: "Paris", tz: "Europe/Paris" },
  { label: "Berlin", tz: "Europe/Berlin" },
  { label: "Moscow", tz: "Europe/Moscow" },
  { label: "Dubai", tz: "Asia/Dubai" },
  { label: "India", tz: "Asia/Kolkata" },
  { label: "Bangkok", tz: "Asia/Bangkok" },
  { label: "Singapore", tz: "Asia/Singapore" },
  { label: "Tokyo", tz: "Asia/Tokyo" },
  { label: "Sydney", tz: "Australia/Sydney" },
  { label: "Auckland", tz: "Pacific/Auckland" },
];

export type EpochUnit = "auto" | "s" | "ms";
export type ParsedEpoch = { ms: number; unit: "s" | "ms" } | { error: string };

const DATE_LIMIT_MS = 8_640_000_000_000_000n;

export function parseEpoch(raw: string, selectedUnit: EpochUnit = "auto"): ParsedEpoch {
  const trimmed = raw.trim();
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(trimmed)) {
    return { error: "Enter a decimal timestamp, such as 1700000000 or 1700000000.123." };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { error: "Timestamp must be finite and within the supported Date range." };
  }
  const unit = selectedUnit === "auto" ? (Math.abs(value) > 1e12 ? "ms" : "s") : selectedUnit;
  const [whole, fraction = ""] = trimmed.replace(/^[+-]/, "").split(".");
  const places = unit === "s" ? 3 : 0;
  if (/[1-9]/.test(fraction.slice(places))) {
    return {
      error: "Timestamp must represent whole milliseconds; finer precision is not supported.",
    };
  }
  // Build integer milliseconds directly so decimal seconds never lose a millisecond to floating point.
  const magnitude = BigInt(whole + fraction.slice(0, places).padEnd(places, "0"));
  if (magnitude > DATE_LIMIT_MS) {
    return { error: "Timestamp is outside the supported Date range (±8,640,000,000,000,000 ms)." };
  }
  return { ms: Number(trimmed.startsWith("-") ? -magnitude : magnitude), unit };
}

export function formatEpoch(ms: number, unit: EpochUnit): string {
  const resolved = unit === "auto" ? (Math.abs(ms) > 1e15 ? "ms" : "s") : unit;
  if (resolved === "ms") return String(ms);
  const absolute = BigInt(Math.abs(ms));
  const fraction = String(absolute % 1000n)
    .padStart(3, "0")
    .replace(/0+$/, "");
  return `${ms < 0 ? "-" : ""}${absolute / 1000n}${fraction ? `.${fraction}` : ""}`;
}

export function formatInZone(date: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(date)
      .replace(",", "");
  } catch {
    return "Invalid timezone";
  }
}

export function formatUtcString(date: Date): string {
  return date.toUTCString();
}

export function formatRfc3339(date: Date): string {
  return date.toISOString();
}

export function formatRfc7231(date: Date): string {
  return date.toUTCString();
}

export function formatIso9075(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

export function formatMongoObjectIdSeed(date: Date): string | null {
  const seconds = Math.floor(date.getTime() / 1000);
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 0xffff_ffff) return null;
  return seconds.toString(16).padStart(8, "0");
}

export function getDerivedTimestampFormats(date: Date): DerivedTimestampFormat[] {
  const seed = formatMongoObjectIdSeed(date);
  return [
    { label: "ISO 8601", value: date.toISOString() },
    { label: "RFC 3339", value: formatRfc3339(date) },
    { label: "RFC 7231", value: formatRfc7231(date) },
    { label: "UTC string", value: formatUtcString(date) },
    { label: "ISO 9075", value: formatIso9075(date) },
    ...(seed === null ? [] : [{ label: "Mongo ObjectID seed", value: seed }]),
  ];
}

export function localInputToMs(value: string): number | null {
  const match = /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(
    value
  );
  if (!match) return null;
  const [, year, month, day, hour, minute, second = "0", fraction = ""] = match;
  const parts = [
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    Number(fraction.padEnd(3, "0")),
  ];
  if (parts[0] < 1) return null;
  const date = new Date(0);
  date.setFullYear(parts[0], parts[1], parts[2]);
  date.setHours(parts[3], parts[4], parts[5], parts[6]);
  const actual = [
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  ];
  return actual.every((part, index) => part === parts[index]) ? date.getTime() : null;
}

export function msToLocalInput(ms: number): string {
  const date = new Date(ms);
  if (!Number.isFinite(date.getTime()) || date.getFullYear() < 1) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${String(date.getFullYear()).padStart(4, "0")}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${String(date.getMilliseconds()).padStart(3, "0")}`;
}
