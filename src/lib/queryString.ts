export interface QueryEntry {
  key: string;
  value: string;
}
export interface QueryDocument {
  prefix: string;
  hash: string;
  entries: QueryEntry[];
}
export function parseQuery(input: string): QueryDocument {
  const hashAt = input.indexOf("#");
  const hash = hashAt < 0 ? "" : input.slice(hashAt);
  const source = hashAt < 0 ? input : input.slice(0, hashAt);
  const question = source.indexOf("?");
  const fullUrl = /^[a-z][a-z\d+.-]*:\/\//i.test(source);
  const prefix = question >= 0 ? source.slice(0, question) : fullUrl ? source : "";
  const query = question >= 0 ? source.slice(question + 1) : fullUrl ? "" : source;
  return {
    prefix,
    hash,
    entries: Array.from(new URLSearchParams(query), ([key, value]) => ({ key, value })),
  };
}
export function buildQuery(document: QueryDocument): string {
  const params = new URLSearchParams();
  for (const entry of document.entries) params.append(entry.key, entry.value);
  const query = params.toString();
  return document.prefix + (query ? (document.prefix ? "?" : "") + query : "") + document.hash;
}
