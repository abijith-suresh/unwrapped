import { describe, expect, it } from "vitest";

import { inspectUrl } from "./urlInspector";

describe("inspectUrl", () => {
  it("parses full URLs and preserves duplicate query keys", () => {
    expect(
      inspectUrl("https://user:pass@example.com:8443/path/name?foo=1&foo=2&bar=hello%20world#frag")
    ).toEqual({
      ok: true,
      inspection: {
        kind: "url",
        normalized:
          "https://user:pass@example.com:8443/path/name?foo=1&foo=2&bar=hello%20world#frag",
        protocol: "https:",
        hostname: "example.com",
        port: "8443",
        path: "/path/name",
        hash: "#frag",
        username: "user",
        password: "pass",
        queryParams: [
          { key: "foo", value: "1" },
          { key: "foo", value: "2" },
          { key: "bar", value: "hello world" },
        ],
      },
    });
  });

  it("parses raw query strings locally", () => {
    expect(inspectUrl("?a=1&a=2&space=hello%20world")).toEqual({
      ok: true,
      inspection: {
        kind: "query",
        normalized: "?a=1&a=2&space=hello+world",
        protocol: "",
        hostname: "",
        port: "",
        path: "",
        hash: "",
        username: "",
        password: "",
        queryParams: [
          { key: "a", value: "1" },
          { key: "a", value: "2" },
          { key: "space", value: "hello world" },
        ],
      },
    });
  });

  it("returns clear validation feedback for invalid input", () => {
    expect(inspectUrl("not a url")).toEqual({
      ok: false,
      error: "Enter a full URL or a raw query string.",
    });
  });
});
