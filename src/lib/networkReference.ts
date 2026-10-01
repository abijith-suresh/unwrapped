export type ReferenceKind = "all" | "dns" | "headers";
export interface NetworkReferenceEntry {
  kind: "dns" | "headers";
  name: string;
  description: string;
  example: string;
  source: string;
}
// Bundled reference checked against IANA DNS parameters and MDN HTTP headers on 2026-10-01.
export const NETWORK_REFERENCE: NetworkReferenceEntry[] = [
  {
    kind: "dns",
    name: "A",
    description: "IPv4 address for a hostname.",
    example: "example.com. 300 IN A 192.0.2.1",
    source: "https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml",
  },
  {
    kind: "dns",
    name: "AAAA",
    description: "IPv6 address for a hostname.",
    example: "example.com. 300 IN AAAA 2001:db8::1",
    source: "https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml",
  },
  {
    kind: "dns",
    name: "CNAME",
    description: "Alias pointing to another canonical domain name.",
    example: "www.example.com. 300 IN CNAME example.com.",
    source: "https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml",
  },
  {
    kind: "dns",
    name: "MX",
    description: "Mail server name with preference; lower values take priority.",
    example: "example.com. 300 IN MX 10 mail.example.com.",
    source: "https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml",
  },
  {
    kind: "dns",
    name: "TXT",
    description: "Text strings, often used for domain verification and email policies.",
    example: 'example.com. 300 IN TXT "v=spf1 -all"',
    source: "https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml",
  },
  {
    kind: "dns",
    name: "NS",
    description: "Authoritative name server for a zone.",
    example: "example.com. 300 IN NS ns1.example.net.",
    source: "https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml",
  },
  {
    kind: "dns",
    name: "SOA",
    description: "Zone authority, serial number, and refresh timers.",
    example: "example.com. IN SOA ns1.example.net. hostmaster.example.com. (1 3600 600 86400 300)",
    source: "https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml",
  },
  {
    kind: "dns",
    name: "PTR",
    description: "Reverse mapping from an address to a domain name.",
    example: "1.2.0.192.in-addr.arpa. 300 IN PTR example.com.",
    source: "https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml",
  },
  {
    kind: "dns",
    name: "SRV",
    description: "Service endpoint with priority, weight, port, and hostname.",
    example: "_sip._tcp.example.com. 300 IN SRV 10 5 5060 sip.example.com.",
    source: "https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml",
  },
  {
    kind: "dns",
    name: "CAA",
    description: "Certificate authorities permitted to issue certificates.",
    example: 'example.com. 300 IN CAA 0 issue "letsencrypt.org"',
    source: "https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml",
  },
  {
    kind: "headers",
    name: "Content-Type",
    description: "Media type of the representation.",
    example: "Content-Type: application/json; charset=utf-8",
    source: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Type",
  },
  {
    kind: "headers",
    name: "Accept",
    description: "Media types the client can accept.",
    example: "Accept: application/json",
    source: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept",
  },
  {
    kind: "headers",
    name: "Authorization",
    description: "Credentials for the target resource.",
    example: "Authorization: Bearer <token>",
    source: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Authorization",
  },
  {
    kind: "headers",
    name: "Cache-Control",
    description: "Directives controlling storage and reuse by caches.",
    example: "Cache-Control: no-store",
    source: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control",
  },
  {
    kind: "headers",
    name: "ETag",
    description: "Opaque representation validator, used in conditional requests.",
    example: 'ETag: "version-1"',
    source: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag",
  },
  {
    kind: "headers",
    name: "If-None-Match",
    description: "Requests a response only when a validator does not match.",
    example: 'If-None-Match: "version-1"',
    source: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-None-Match",
  },
  {
    kind: "headers",
    name: "Location",
    description: "Redirect target or URL of a newly created resource.",
    example: "Location: https://example.com/new",
    source: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Location",
  },
  {
    kind: "headers",
    name: "Content-Encoding",
    description: "Coding applied to the representation, such as gzip.",
    example: "Content-Encoding: gzip",
    source: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Encoding",
  },
  {
    kind: "headers",
    name: "Access-Control-Allow-Origin",
    description: "Origin allowed to read a response through CORS.",
    example: "Access-Control-Allow-Origin: https://example.com",
    source:
      "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Origin",
  },
  {
    kind: "headers",
    name: "Content-Security-Policy",
    description: "Policy limiting resources a document can load or execute.",
    example: "Content-Security-Policy: default-src 'self'",
    source:
      "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy",
  },
  {
    kind: "headers",
    name: "Strict-Transport-Security",
    description: "Policy telling browsers to use HTTPS for future requests.",
    example: "Strict-Transport-Security: max-age=31536000",
    source:
      "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security",
  },
  {
    kind: "headers",
    name: "X-Content-Type-Options",
    description: "Disables MIME sniffing when set to nosniff.",
    example: "X-Content-Type-Options: nosniff",
    source:
      "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options",
  },
];
export function searchNetworkReference(
  query: string,
  kind: ReferenceKind = "all"
): NetworkReferenceEntry[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return NETWORK_REFERENCE.filter(
    (entry) =>
      (kind === "all" || entry.kind === kind) &&
      words.every((word) =>
        `${entry.name} ${entry.description} ${entry.example}`.toLowerCase().includes(word)
      )
  );
}
