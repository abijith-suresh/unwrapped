export type TextFormat =
  | "text"
  | "json"
  | "yaml"
  | "xml"
  | "toml"
  | "csv"
  | "markdown"
  | "css"
  | "base64";

const FORMATS: Record<TextFormat, { extension: string; mime: string }> = {
  text: { extension: "txt", mime: "text/plain" },
  json: { extension: "json", mime: "application/json" },
  yaml: { extension: "yaml", mime: "application/yaml" },
  xml: { extension: "xml", mime: "application/xml" },
  toml: { extension: "toml", mime: "application/toml" },
  csv: { extension: "csv", mime: "text/csv" },
  markdown: { extension: "md", mime: "text/markdown" },
  css: { extension: "css", mime: "text/css" },
  base64: { extension: "b64", mime: "text/plain" },
};

export interface TextDownloadOptions {
  format?: TextFormat;
  fileName?: string;
}

export function createTextDownload(value: string, options: TextDownloadOptions = {}) {
  const format = FORMATS[options.format ?? "text"];
  return {
    blob: new Blob([value], { type: `${format.mime};charset=utf-8` }),
    fileName: options.fileName ?? `output.${format.extension}`,
  };
}

/** Allow the browser to begin reading the blob before releasing its URL. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  try {
    link.href = url;
    link.download = fileName;
    link.hidden = true;
    document.body.append(link);
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }
}

export function downloadText(value: string, options?: TextDownloadOptions): void {
  const { blob, fileName } = createTextDownload(value, options);
  downloadBlob(blob, fileName);
}

export function serializeResultFields(fields: readonly { label: string; value: string }[]): string {
  return fields
    .filter((field) => field.value !== "")
    .map((field) => `${field.label}\n${field.value}`)
    .join("\n\n");
}
