import type { TextFormat } from "@/lib/textFormat";

export type ToolCategory =
  | "encoding"
  | "security"
  | "text"
  | "generators"
  | "time"
  | "data"
  | "network";

/**
 * Named accent hues for per-tool identity. Each maps to CSS overrides for the
 * shared `--accent-primary`/`--accent-secondary` tokens, set via
 * `[data-tool-accent="…"]` in `src/styles/themes.css`.
 */
export type ToolAccent =
  | "blue"
  | "violet"
  | "magenta"
  | "rose"
  | "orange"
  | "amber"
  | "lime"
  | "emerald"
  | "teal"
  | "cyan";

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  keywords: string[];
  icon: string; // lucide icon name
  slug: string; // matches folder name, used in URL
  componentPath: string;
  accent: ToolAccent;
  help?: readonly string[];
  inputFormats?: readonly TextFormat[];
}

export const tools: Tool[] = [
  {
    id: "jwt-decoder",
    help: ["Decoding shows token contents. It does not verify the signature."],
    name: "JWT Decoder",
    description: "Decode and inspect JSON Web Tokens. View header, payload, expiry.",
    category: "security",
    keywords: ["jwt", "token", "bearer", "auth", "decode", "json web token"],
    icon: "KeyRound",
    slug: "jwt-decoder",
    componentPath: "/src/tools/jwt-decoder/JwtDecoder.tsx",
    accent: "violet",
  },
  {
    id: "diff",
    inputFormats: ["text"],
    help: [
      "Large and structured comparisons run in a background worker with a ten-second timeout. Edit an input to retry after cancellation or timeout.",
    ],
    name: "Text Diff",
    description: "Compare two texts or configs side by side with highlighted differences.",
    category: "text",
    keywords: ["diff", "compare", "config", "delta", "difference", "text"],
    icon: "GitCompare",
    slug: "diff",
    componentPath: "/src/tools/diff/DiffTool.tsx",
    accent: "blue",
  },
  {
    id: "html-entities",
    help: [
      "Decoding requires a terminating semicolon. Output is displayed as text, never rendered as HTML.",
    ],
    name: "HTML Entities",
    description: "Encode HTML special characters or decode named and numeric character references.",
    category: "encoding",
    keywords: ["html", "entities"],
    icon: "Tag",
    slug: "html-entities",
    componentPath: "/src/tools/html-entities/Tool.tsx",
    accent: "orange",
  },
  {
    id: "base64",
    inputFormats: ["text", "base64"],
    name: "Base64",
    description: "Encode and decode Base64 strings. Supports file drag-and-drop.",
    category: "encoding",
    keywords: ["base64", "encode", "decode", "binary", "btoa", "atob"],
    icon: "Binary",
    slug: "base64",
    componentPath: "/src/tools/base64/Base64Tool.tsx",
    accent: "cyan",
  },
  {
    id: "json-schema-validator",
    inputFormats: ["json"],
    help: [
      "Supports JSON Schema draft-07, standard formats, strict schema checks and local references. External schemas are never fetched.",
      "Data is not coerced or changed. Each input is limited to 100,000 characters.",
    ],
    name: "JSON Schema Validator",
    description: "Validate JSON against draft-07 schemas and inspect errors by document path.",
    category: "data",
    keywords: ["json", "schema", "validator"],
    icon: "Braces",
    slug: "json-schema-validator",
    componentPath: "/src/tools/json-schema-validator/Tool.tsx",
    accent: "amber",
  },
  {
    id: "json-formatter",
    inputFormats: ["json"],
    name: "JSON Formatter",
    description: "Format and minify JSON with syntax highlighting.",
    category: "data",
    keywords: ["json", "format", "prettify", "minify", "syntax"],
    icon: "Braces",
    slug: "json-formatter",
    componentPath: "/src/tools/json-formatter/JsonFormatter.tsx",
    accent: "amber",
  },
  {
    id: "hash-generator",
    inputFormats: ["text"],
    name: "Hash Generator",
    description: "Generate SHA-1, SHA-256, SHA-384, and SHA-512 hashes from text.",
    category: "security",
    keywords: ["hash", "sha", "sha256", "sha512", "checksum", "digest", "crypto"],
    icon: "Fingerprint",
    slug: "hash-generator",
    componentPath: "/src/tools/hash-generator/HashGenerator.tsx",
    accent: "emerald",
  },
  {
    id: "uuid-generator",
    help: ["Generates UUID v4. Up to 100 UUIDs at once."],
    name: "UUID Generator",
    description: "Generate cryptographically secure UUIDs (v4) in bulk.",
    category: "generators",
    keywords: ["uuid", "guid", "unique", "id", "random", "generate"],
    icon: "Shuffle",
    slug: "uuid-generator",
    componentPath: "/src/tools/uuid-generator/UuidGenerator.tsx",
    accent: "teal",
  },
  {
    id: "timestamp",
    help: ["Unix timestamp units are detected as seconds or milliseconds."],
    name: "Timestamp Converter",
    description: "Convert Unix timestamps to human-readable dates across timezones.",
    category: "time",
    keywords: ["timestamp", "unix", "epoch", "date", "time", "convert", "utc"],
    icon: "Clock",
    slug: "timestamp",
    componentPath: "/src/tools/timestamp/TimestampTool.tsx",
    accent: "orange",
  },
  {
    id: "regex-tester",
    inputFormats: ["text"],
    help: [
      "User patterns run in a background worker with a two-second timeout and a 10,000-match limit. Edit an input to retry after cancellation or timeout.",
      'Capture counts total numbered group slots across matches, including unmatched groups. Named groups are separate aliases, not extra captures. Reports use null for unmatched groups and "" for matched empty strings.',
    ],
    name: "Regex Tester",
    description: "Test regular expressions with real-time match highlighting.",
    category: "text",
    keywords: ["regex", "regexp", "regular expression", "pattern", "match", "test"],
    icon: "Regex",
    slug: "regex-tester",
    componentPath: "/src/tools/regex-tester/RegexTester.tsx",
    accent: "magenta",
  },
  {
    id: "case-converter",
    inputFormats: ["text"],
    name: "Case Converter",
    description: "Fan out one input into common case styles for code, paths, and titles.",
    category: "text",
    keywords: ["case", "camel", "pascal", "snake", "kebab", "header", "convert", "text"],
    icon: "CaseSensitive",
    slug: "case-converter",
    componentPath: "/src/tools/case-converter/CaseConverter.tsx",
    accent: "lime",
  },
  {
    id: "css-minifier",
    inputFormats: ["css"],
    help: ["Rule order and custom property values are preserved. Input limit: 100,000 characters."],
    name: "CSS Minifier",
    description: "Minify CSS locally while preserving rule order and displaying parser errors.",
    category: "text",
    keywords: ["css", "minifier"],
    icon: "AlignLeft",
    slug: "css-minifier",
    componentPath: "/src/tools/css-minifier/Tool.tsx",
    accent: "cyan",
  },
  {
    id: "text-statistics",
    inputFormats: ["text"],
    help: ["Byte size is measured as UTF-8."],
    name: "Text Statistics",
    description: "Inspect character, word, line, and byte counts for local text input.",
    category: "text",
    keywords: ["text", "statistics", "count", "words", "lines", "bytes", "characters"],
    icon: "TextCursorInput",
    slug: "text-statistics",
    componentPath: "/src/tools/text-statistics/TextStatisticsTool.tsx",
    accent: "teal",
  },
  {
    id: "password-strength",
    help: [
      "Estimates guessability using English word lists and common patterns. It is not a guarantee of security or a breach check. Limit: 256 characters.",
    ],
    name: "Password Strength Meter",
    description: "Estimate password guessability using bundled dictionaries and pattern matching.",
    category: "security",
    keywords: ["password", "strength"],
    icon: "ShieldCheck",
    slug: "password-strength",
    componentPath: "/src/tools/password-strength/Tool.tsx",
    accent: "rose",
  },
  {
    id: "token-generator",
    help: ["Generates tokens with browser cryptography using the selected character sets."],
    name: "Token Generator",
    description: "Generate configurable random tokens with browser-local cryptography.",
    category: "generators",
    keywords: ["token", "password", "random", "generate", "crypto", "secret"],
    icon: "KeySquare",
    slug: "token-generator",
    componentPath: "/src/tools/token-generator/TokenGenerator.tsx",
    accent: "rose",
  },
  {
    id: "url-encoder",
    inputFormats: ["text"],
    name: "URL Encoder / Decoder",
    description: "Percent-encode or decode text locally with clear invalid-input feedback.",
    category: "encoding",
    keywords: ["url", "encode", "decode", "percent", "uri", "query"],
    icon: "Link2",
    slug: "url-encoder",
    componentPath: "/src/tools/url-encoder/UrlEncoderTool.tsx",
    accent: "blue",
  },
  {
    id: "network-reference",
    help: [
      "Bundled reference checked on October 1, 2026. No DNS queries or HTTP requests are made. Source links open external documentation.",
    ],
    name: "DNS & HTTP Headers Reference",
    description: "Search bundled DNS record types and HTTP headers with copyable examples.",
    category: "network",
    keywords: ["network", "reference"],
    icon: "BadgeInfo",
    slug: "network-reference",
    componentPath: "/src/tools/network-reference/Tool.tsx",
    accent: "cyan",
  },
  {
    id: "http-status-codes",
    name: "HTTP Status Codes",
    description: "Search a bundled local reference of common HTTP response codes.",
    category: "network",
    keywords: ["http", "status", "codes", "response", "network", "api"],
    icon: "BadgeInfo",
    slug: "http-status-codes",
    componentPath: "/src/tools/http-status-codes/HttpStatusCodesTool.tsx",
    accent: "cyan",
  },
  {
    id: "json-to-yaml",
    inputFormats: ["json"],
    name: "JSON to YAML",
    description: "Convert JSON documents into YAML locally with stable nested key ordering.",
    category: "data",
    keywords: ["json", "yaml", "convert", "data", "serialize", "format"],
    icon: "ArrowRightLeft",
    slug: "json-to-yaml",
    componentPath: "/src/tools/json-to-yaml/JsonToYamlTool.tsx",
    accent: "emerald",
  },
  {
    id: "yaml-to-json",
    inputFormats: ["yaml"],
    name: "YAML to JSON",
    description: "Convert YAML documents into formatted JSON locally.",
    category: "data",
    keywords: ["yaml", "json", "convert", "data", "parse", "format"],
    icon: "ArrowRightLeft",
    slug: "yaml-to-json",
    componentPath: "/src/tools/yaml-to-json/YamlToJsonTool.tsx",
    accent: "amber",
  },
  {
    id: "toml-formatter",
    inputFormats: ["toml"],
    help: [
      "Formats TOML 1.0. Comments and original whitespace are removed.",
      "Numeric literals and timestamp precision are preserved. Leap-second timestamps are rejected. Input limit: 100,000 characters.",
    ],
    name: "TOML Formatter",
    description: "Parse and format TOML tables, arrays, and configuration values locally.",
    category: "data",
    keywords: ["toml", "formatter"],
    icon: "AlignLeft",
    slug: "toml-formatter",
    componentPath: "/src/tools/toml-formatter/Tool.tsx",
    accent: "teal",
  },
  {
    id: "yaml-formatter",
    inputFormats: ["yaml"],
    name: "YAML Formatter",
    description: "Format YAML locally with indent controls and optional key sorting.",
    category: "data",
    keywords: ["yaml", "format", "prettify", "indent", "sort", "lint"],
    icon: "AlignLeft",
    slug: "yaml-formatter",
    componentPath: "/src/tools/yaml-formatter/YamlFormatterTool.tsx",
    accent: "lime",
  },
  {
    id: "xml-formatter",
    inputFormats: ["xml"],
    name: "XML Formatter",
    description: "Format XML locally with indentation control and clear invalid-input feedback.",
    category: "data",
    keywords: ["xml", "format", "prettify", "indent", "markup", "validate"],
    icon: "Tag",
    slug: "xml-formatter",
    componentPath: "/src/tools/xml-formatter/XmlFormatterTool.tsx",
    accent: "orange",
  },
  {
    id: "markdown-table",
    inputFormats: ["csv", "markdown"],
    help: [
      "The first CSV or TSV row is the header. Markdown converts to CSV.",
      "Cell newlines use <br>. Literal HTML and entities are escaped to preserve cell text; inline formatting stays as text.",
      "Leading and trailing cell whitespace must be trimmed first. Input limit: 100,000 characters.",
    ],
    name: "Markdown Table Converter",
    description: "Convert CSV and TSV into Markdown tables, or export Markdown tables as CSV.",
    category: "text",
    keywords: ["markdown", "table"],
    icon: "TableProperties",
    slug: "markdown-table",
    componentPath: "/src/tools/markdown-table/Tool.tsx",
    accent: "lime",
  },
  {
    id: "json-to-csv",
    inputFormats: ["json"],
    name: "JSON to CSV",
    description: "Convert arrays of JSON objects into CSV locally.",
    category: "data",
    keywords: ["json", "csv", "convert", "export", "table", "data"],
    icon: "TableProperties",
    slug: "json-to-csv",
    componentPath: "/src/tools/json-to-csv/JsonToCsvTool.tsx",
    accent: "violet",
  },
  {
    id: "chmod-calculator",
    name: "chmod Calculator",
    description: "Derive octal, symbolic, and command output for Unix file permissions.",
    category: "security",
    keywords: ["chmod", "permissions", "unix", "linux", "octal", "symbolic"],
    icon: "ShieldCheck",
    slug: "chmod-calculator",
    componentPath: "/src/tools/chmod-calculator/ChmodCalculatorTool.tsx",
    accent: "rose",
  },
  {
    id: "hmac-generator",
    name: "HMAC Generator",
    description: "Generate SHA-based HMAC signatures locally with the browser Web Crypto API.",
    category: "security",
    keywords: ["hmac", "crypto", "sha", "signature", "secret", "webhook"],
    icon: "KeyRound",
    slug: "hmac-generator",
    componentPath: "/src/tools/hmac-generator/HmacGeneratorTool.tsx",
    accent: "magenta",
  },
  {
    id: "query-string-editor",
    help: [
      "Duplicate keys and parameter order are preserved. Spaces encode as +; a literal + encodes as %2B. The path and fragment stay intact.",
    ],
    name: "Query String Editor",
    description: "Edit URL query parameters while preserving duplicate keys, order, and fragments.",
    category: "network",
    keywords: ["query", "string", "editor"],
    icon: "Link2",
    slug: "query-string-editor",
    componentPath: "/src/tools/query-string-editor/Tool.tsx",
    accent: "blue",
  },
  {
    id: "url-inspector",
    name: "URL Inspector",
    description: "Parse full URLs or raw query strings locally and inspect decoded sections.",
    category: "network",
    keywords: ["url", "query", "params", "parse", "inspect", "search"],
    icon: "Search",
    slug: "url-inspector",
    componentPath: "/src/tools/url-inspector/UrlInspectorTool.tsx",
    accent: "blue",
  },
  {
    id: "cron",
    help: [
      "Five numeric fields. Sunday is 0. Restricted day-of-month and day-of-week fields use OR semantics.",
      "Supports minute, hour, day-of-month, month and day-of-week with *, lists, ranges and steps.",
    ],
    name: "Cron Schedule",
    description: "Build cron expressions, humanize schedules, and preview upcoming runs locally.",
    category: "time",
    keywords: ["cron", "schedule", "time", "parser", "builder", "preview", "humanize"],
    icon: "CalendarClock",
    slug: "cron",
    componentPath: "/src/tools/cron/CronTool.tsx",
    accent: "violet",
  },
];

export function getToolRoute(slug: string): `/tools/${string}` {
  return `/tools/${slug}`;
}

export function validateToolRegistry(availableComponentPaths: readonly string[] = []): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();

  for (const tool of tools) {
    if (seenIds.has(tool.id)) {
      errors.push(`Duplicate tool id: ${tool.id}`);
    } else {
      seenIds.add(tool.id);
    }

    if (seenSlugs.has(tool.slug)) {
      errors.push(`Duplicate tool slug: ${tool.slug}`);
    } else {
      seenSlugs.add(tool.slug);
    }

    if (
      availableComponentPaths.length > 0 &&
      !availableComponentPaths.includes(tool.componentPath)
    ) {
      errors.push(`Missing tool component: ${tool.componentPath}`);
    }
  }

  return errors;
}

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}
