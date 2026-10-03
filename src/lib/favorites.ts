import { tools } from "@/tools/registry";

const toolIds = new Set(tools.map((tool) => tool.id));

export function normalizeFavorites(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(value.filter((id): id is string => typeof id === "string" && toolIds.has(id))),
  ];
}

export function toggleFavorite(ids: readonly string[], id: string): string[] {
  if (!toolIds.has(id)) return [...ids];
  return ids.includes(id) ? ids.filter((favorite) => favorite !== id) : [...ids, id];
}
