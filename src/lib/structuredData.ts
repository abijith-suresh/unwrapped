import { type Node, type ParseError, parseTree, printParseErrorCode } from "jsonc-parser";
import { type Document, type ScalarTag, visit } from "yaml";

/** A numeric token, distinct from any user object with similarly named properties. */
export class JsonNumber {
  constructor(readonly source: string) {
    if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(source)) {
      throw new Error(`Invalid JSON number: ${source}`);
    }
  }

  toString(): string {
    return this.source;
  }
}

export function parseJson(source: string): unknown {
  const errors: ParseError[] = [];
  const root = parseTree(source, errors, { disallowComments: true, allowTrailingComma: false });
  if (errors.length)
    throw new SyntaxError(
      `${printParseErrorCode(errors[0].error)} at position ${errors[0].offset}`
    );
  if (!root) throw new SyntaxError("Expected JSON value at position 0");

  function read(node: Node): unknown {
    if (node.type === "number")
      return new JsonNumber(source.slice(node.offset, node.offset + node.length));
    if (node.type === "array") return (node.children ?? []).map(read);
    if (node.type === "object") {
      const entries = (node.children ?? []).map((property) => {
        const [key, value] = property.children ?? [];
        return [String(key.value), read(value)] as const;
      });
      if (new Set(entries.map(([key]) => key)).size !== entries.length) {
        throw new SyntaxError(`Duplicate key at position ${node.offset}`);
      }
      return Object.fromEntries(entries);
    }
    return node.value;
  }
  return read(root);
}

export function stringifyJson(value: unknown, indent = 0): string {
  const unit = " ".repeat(Math.max(0, Math.min(10, indent)));
  const ancestors = new Set<object>();
  function write(item: unknown, depth: number): string {
    if (item instanceof JsonNumber) return item.source;
    if (typeof item === "bigint") return String(item);
    if (
      item === null ||
      typeof item === "string" ||
      typeof item === "boolean" ||
      typeof item === "number"
    ) {
      if (typeof item === "number" && !Number.isFinite(item))
        throw new Error("Non-finite numbers cannot be represented as JSON.");
      return JSON.stringify(item);
    }
    if (!item || typeof item !== "object") throw new Error("Value cannot be represented as JSON.");
    if (ancestors.has(item)) throw new Error("Circular values cannot be represented as JSON.");
    ancestors.add(item);
    const array = Array.isArray(item);
    const parts = array
      ? item.map((child) => write(child, depth + 1))
      : Object.entries(item).map(
          ([key, child]) => `${JSON.stringify(key)}:${unit ? " " : ""}${write(child, depth + 1)}`
        );
    ancestors.delete(item);
    const [open, close] = array ? ["[", "]"] : ["{", "}"];
    if (!parts.length) return open + close;
    return unit
      ? `${open}\n${unit.repeat(depth + 1)}${parts.join(`,\n${unit.repeat(depth + 1)}`)}\n${unit.repeat(depth)}${close}`
      : open + parts.join(",") + close;
  }
  return write(value, 0);
}

export function sortObjectKeys<T>(value: T): T {
  if (Array.isArray(value)) return value.map(sortObjectKeys) as T;
  if (
    value !== null &&
    typeof value === "object" &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
  ) {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, sortObjectKeys((value as Record<string, unknown>)[key])])
    ) as T;
  }
  return value;
}

export const JSON_NUMBER_YAML_TAG: ScalarTag = {
  tag: "tag:yaml.org,2002:float",
  default: true,
  identify: (value) => value instanceof JsonNumber,
  resolve: (value) => new JsonNumber(value),
  stringify: (item) => (item.value as JsonNumber).source,
};

/** Read source decimals before toJS can turn them into rounded JavaScript numbers. */
export function readYamlValue(document: Document, jsonCompatible = false): unknown {
  if (document.errors.length) throw document.errors[0];
  visit(document, {
    Scalar(_key, node) {
      if (typeof node.value !== "number" && typeof node.value !== "bigint") return;
      if (
        typeof node.value === "number" &&
        !Number.isFinite(node.value) &&
        !node.source?.match(/[eE]/)
      ) {
        if (jsonCompatible)
          throw new Error("Non-finite YAML numbers cannot be represented as JSON.");
        return;
      }
      const source = node.source
        ?.replaceAll("_", "")
        .replace(/^\+/, "")
        .replace(/^(-?)\./, "$10.")
        .replace(/\.(?=[eE]|$)/, ".0");
      if (typeof node.value === "bigint" && source && !/^-?\d+$/.test(source)) return;
      node.value = new JsonNumber(source ?? String(node.value));
    },
  });
  return document.toJS() as unknown;
}
