export interface UrlQueryParam {
  key: string;
  value: string;
}

export interface UrlInspection {
  kind: "url" | "query";
  normalized: string;
  protocol: string;
  hostname: string;
  port: string;
  path: string;
  hash: string;
  username: string;
  password: string;
  queryParams: UrlQueryParam[];
}

export type UrlInspectionResult =
  | {
      ok: true;
      inspection: UrlInspection;
    }
  | {
      ok: false;
      error: string;
    };

function toQueryParams(params: URLSearchParams): UrlQueryParam[] {
  return Array.from(params.entries(), ([key, value]) => ({ key, value }));
}

function looksLikeRawQueryString(input: string): boolean {
  const trimmed = input.trim();
  return (
    trimmed.startsWith("?") ||
    (!/\s/.test(trimmed) && (trimmed.includes("=") || trimmed.includes("&")))
  );
}

function inspectQueryString(input: string): UrlInspectionResult {
  const trimmed = input.trim();
  const query = trimmed.startsWith("?") ? trimmed.slice(1) : trimmed;
  const params = new URLSearchParams(query);

  return {
    ok: true,
    inspection: {
      kind: "query",
      normalized: query.length > 0 ? `?${params.toString()}` : "",
      protocol: "",
      hostname: "",
      port: "",
      path: "",
      hash: "",
      username: "",
      password: "",
      queryParams: toQueryParams(params),
    },
  };
}

export function inspectUrl(input: string): UrlInspectionResult {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return {
      ok: false,
      error: "Enter a full URL or a raw query string.",
    };
  }

  try {
    const url = new URL(trimmed);

    return {
      ok: true,
      inspection: {
        kind: "url",
        normalized: url.href,
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        hash: url.hash,
        username: url.username,
        password: url.password,
        queryParams: toQueryParams(url.searchParams),
      },
    };
  } catch {
    if (looksLikeRawQueryString(trimmed)) {
      return inspectQueryString(trimmed);
    }

    return {
      ok: false,
      error: "Enter a full URL or a raw query string.",
    };
  }
}
