import { type Tool, tools } from "@/tools/registry";

const RELEVANCE_ORDER: readonly string[] = [
  "json-formatter",
  "base64",
  "diff",
  "regex-tester",
  "jwt-decoder",
  "hash-generator",
  "uuid-generator",
  "timestamp",
];

function rank(id: string): number {
  const index = RELEVANCE_ORDER.indexOf(id);
  return index === -1 ? RELEVANCE_ORDER.length : index;
}

const orderedTools = [...tools].sort((a, b) => rank(a.id) - rank(b.id));
const aliases: Record<string, string> = { encoder: "encode", decoder: "decode" };

export function searchTools(query: string): readonly Tool[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return orderedTools;
  return orderedTools.filter((tool) => {
    const text = [tool.name, tool.description, ...tool.keywords].join(" ").toLowerCase();
    return terms.every((term) => text.includes(aliases[term] ?? term));
  });
}
