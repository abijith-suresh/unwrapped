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

export interface ToolSearchOrder {
  favoriteIds?: readonly string[];
  rotation?: number;
}

export function searchTools(query: string, order: ToolSearchOrder = {}): readonly Tool[] {
  const favorites = new Set(order.favoriteIds);
  const rotation = Number.isSafeInteger(order.rotation) ? (order.rotation ?? 0) : 0;
  const offset = ((rotation % orderedTools.length) + orderedTools.length) % orderedTools.length;
  const rotated = [...orderedTools.slice(offset), ...orderedTools.slice(0, offset)];
  const catalog = [
    ...orderedTools.filter((tool) => favorites.has(tool.id)),
    ...rotated.filter((tool) => !favorites.has(tool.id)),
  ];
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return catalog;
  return catalog.filter((tool) => {
    const text = [tool.name, tool.description, ...tool.keywords].join(" ").toLowerCase();
    return terms.every((term) => text.includes(aliases[term] ?? term));
  });
}
