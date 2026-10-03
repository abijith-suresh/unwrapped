import { JsonNumber, parseJson, stringifyJson } from "@/lib/structuredData";

export interface ParsedJwt {
  header: unknown;
  payload: unknown;
  signature: string;
}

export interface JwtExpiryStatus {
  expired: boolean | null;
  label: string;
}

export type RegisteredJwtClaimKey =
  | "alg"
  | "typ"
  | "iss"
  | "sub"
  | "aud"
  | "exp"
  | "nbf"
  | "iat"
  | "jti";

export interface JwtClaimSummaryItem {
  key: RegisteredJwtClaimKey;
  label: string;
  rawValue: string;
  displayValue: string;
  section: "header" | "payload";
}

const REGISTERED_CLAIMS: Array<{
  key: RegisteredJwtClaimKey;
  label: string;
  section: "header" | "payload";
}> = [
  { key: "alg", label: "Algorithm", section: "header" },
  { key: "typ", label: "Type", section: "header" },
  { key: "iss", label: "Issuer", section: "payload" },
  { key: "sub", label: "Subject", section: "payload" },
  { key: "aud", label: "Audience", section: "payload" },
  { key: "exp", label: "Expires", section: "payload" },
  { key: "nbf", label: "Not before", section: "payload" },
  { key: "iat", label: "Issued at", section: "payload" },
  { key: "jti", label: "JWT ID", section: "payload" },
];

function decodeBase64UrlBytes(str: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(str) || str.length % 4 === 1) {
    throw new Error("Invalid base64url encoding. Use URL-safe characters without padding.");
  }
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

  let decoded: string;
  try {
    decoded = atob(padded);
  } catch {
    throw new Error("Invalid base64url encoding");
  }

  if (btoa(decoded).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_") !== str) {
    throw new Error("Invalid base64url encoding. Nonzero padding bits are not allowed.");
  }
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

export function decodeBase64Url(str: string): unknown {
  const bytes = decodeBase64UrlBytes(str);
  let utf8: string;
  try {
    // Keep a BOM visible to the JSON parser rather than silently stripping it.
    utf8 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new Error("Expected well-formed UTF-8.");
  }
  return parseJson(utf8);
}

function decodeJwtObject(source: string, section: string): Record<string, unknown> {
  try {
    const value = decodeBase64Url(source);
    if (
      typeof value !== "object" ||
      value === null ||
      Array.isArray(value) ||
      value instanceof JsonNumber
    ) {
      throw new Error("Expected a JSON object.");
    }
    return value as Record<string, unknown>;
  } catch (error) {
    throw new Error(`${section}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function parseJwt(token: string): ParsedJwt {
  const parts = token.trim().split(".");
  if (parts.length !== 3) throw new Error("Expected three base64url parts separated by dots.");

  const [rawHeader, rawPayload, signature] = parts;

  const header = decodeJwtObject(rawHeader, "Header");
  const payload = decodeJwtObject(rawPayload, "Payload");
  try {
    decodeBase64UrlBytes(signature);
  } catch (error) {
    throw new Error(`Signature: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (signature === "" && header.alg !== "none") {
    throw new Error('Signature: an empty signature requires header alg "none".');
  }
  if (header.alg === "none" && signature !== "") {
    throw new Error('Signature: header alg "none" requires an empty signature.');
  }
  return { header, payload, signature };
}

export function prettyJson(value: unknown): string {
  return stringifyJson(value, 2);
}

/** Compare decimals without rounding fractional boundaries or expanding large exponents. */
function compareNumericDates(left: string, right: string): number {
  function decimal(source: string) {
    const [mantissa, exponent = "0"] = source.toLowerCase().split("e");
    const fraction = mantissa.split(".")[1] ?? "";
    const digits = mantissa.replace(/[-.]/g, "").replace(/^0+/, "");
    return {
      sign: digits ? (source.startsWith("-") ? -1 : 1) : 0,
      digits,
      order: BigInt(exponent) - BigInt(fraction.length) + BigInt(digits.length),
    };
  }
  const a = decimal(left);
  const b = decimal(right);
  if (a.sign !== b.sign) return a.sign - b.sign;
  if (a.sign === 0) return 0;
  if (a.order !== b.order) return (a.order < b.order ? -1 : 1) * a.sign;
  const width = Math.max(a.digits.length, b.digits.length);
  const aDigits = a.digits.padEnd(width, "0");
  const bDigits = b.digits.padEnd(width, "0");
  return (aDigits === bDigits ? 0 : aDigits < bDigits ? -1 : 1) * a.sign;
}

function readNumericDate(value: unknown): { seconds: number; error: string | null } {
  if (typeof value !== "number" && !(value instanceof JsonNumber)) {
    return { seconds: NaN, error: "Invalid NumericDate: expected a JSON number." };
  }
  const seconds = value instanceof JsonNumber ? Number(value.source) : value;
  if (!Number.isFinite(seconds)) {
    return { seconds, error: "NumericDate cannot be interpreted as a finite number." };
  }
  const source = value instanceof JsonNumber ? value.source : String(value);
  if (
    compareNumericDates(source, "8640000000000") > 0 ||
    compareNumericDates(source, "-8640000000000") < 0 ||
    !Number.isFinite(new Date(seconds * 1000).getTime())
  ) {
    return { seconds, error: "NumericDate is outside the supported date range." };
  }
  return { seconds, error: null };
}

export function formatJwtTimestamp(value: unknown): string {
  const date = readNumericDate(value);
  return date.error ?? new Date(date.seconds * 1000).toLocaleString();
}

function stringifyJwtClaimValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && !Number.isFinite(value)) return String(value);
  if (value === undefined) return "undefined";
  return stringifyJson(value);
}

function getClaimContainer(
  parsed: ParsedJwt,
  section: "header" | "payload"
): Record<string, unknown> | null {
  const value = parsed[section];
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function humanizeRegisteredClaim(key: RegisteredJwtClaimKey, value: unknown): string {
  if (["exp", "nbf", "iat"].includes(key)) {
    return formatJwtTimestamp(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => stringifyJwtClaimValue(entry)).join(", ");
  }

  return stringifyJwtClaimValue(value);
}

export function getJwtClaimsSummary(parsed: ParsedJwt): JwtClaimSummaryItem[] {
  return REGISTERED_CLAIMS.flatMap((claim) => {
    const container = getClaimContainer(parsed, claim.section);
    if (!container || !Object.hasOwn(container, claim.key)) {
      return [];
    }

    const value = container[claim.key];
    return [
      {
        key: claim.key,
        label: claim.label,
        rawValue: stringifyJwtClaimValue(value),
        displayValue: humanizeRegisteredClaim(claim.key, value),
        section: claim.section,
      },
    ];
  });
}

export function getJwtExpiryStatus(
  payload: unknown,
  nowSeconds: number = Date.now() / 1000
): JwtExpiryStatus | null {
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload) ||
    !Object.hasOwn(payload, "exp")
  )
    return null;

  const exp = (payload as Record<string, unknown>).exp;
  const date = readNumericDate(exp);
  if (date.error) return { expired: null, label: `Expiration unknown. ${date.error}` };
  if (!Number.isFinite(nowSeconds))
    return { expired: null, label: "Expiration unknown. Current time must be finite." };

  const expired =
    exp instanceof JsonNumber
      ? compareNumericDates(String(nowSeconds), exp.source) >= 0
      : nowSeconds >= date.seconds;
  return {
    expired,
    label: expired
      ? `Expired at ${formatJwtTimestamp(exp)}`
      : `Not expired. Expires at ${formatJwtTimestamp(exp)}`,
  };
}
