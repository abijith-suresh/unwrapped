import { describe, expect, it } from "vitest";
import { NETWORK_REFERENCE, searchNetworkReference } from "./networkReference";

describe("network reference", () => {
  it("finds record names, descriptions and examples without case sensitivity", () => {
    expect(searchNetworkReference("ipv6", "dns").map((entry) => entry.name)).toEqual(["AAAA"]);
    expect(searchNetworkReference("cache-control", "headers").map((entry) => entry.name)).toEqual([
      "Cache-Control",
    ]);
    expect(searchNetworkReference("CORS origin", "headers").map((entry) => entry.name)).toEqual([
      "Access-Control-Allow-Origin",
    ]);
  });
  it("supports empty queries, filters and no matches", () => {
    expect(searchNetworkReference("")).toHaveLength(NETWORK_REFERENCE.length);
    expect(searchNetworkReference("", "dns").map((entry) => entry.name)).toEqual([
      "A",
      "AAAA",
      "CNAME",
      "MX",
      "TXT",
      "NS",
      "SOA",
      "PTR",
      "SRV",
      "CAA",
    ]);
    expect(searchNetworkReference("no-such-record")).toEqual([]);
  });
  it("has unique names, usable examples and source URLs", () => {
    expect(new Set(NETWORK_REFERENCE.map((entry) => entry.name)).size).toBe(
      NETWORK_REFERENCE.length
    );
    for (const entry of NETWORK_REFERENCE) {
      expect(entry.example.length).toBeGreaterThan(0);
      expect(new URL(entry.source).protocol).toBe("https:");
    }
  });
});
