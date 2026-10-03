import { describe, expect, it } from "vitest";
import { createTextDownload, serializeResultFields } from "./download";

describe("text downloads", () => {
  it("preserves Unicode, whitespace and numeric tokens byte for byte", async () => {
    const text = ' {"name":"你好","id":9007199254740993,"value":1.2300}\r\n';
    const download = createTextDownload(text, { format: "json" });
    expect(download.fileName).toBe("output.json");
    expect(download.blob.type).toBe("application/json;charset=utf-8");
    expect(new Uint8Array(await download.blob.arrayBuffer())).toEqual(
      new TextEncoder().encode(text)
    );
  });
  it.each([
    ["yaml", "yaml"],
    ["markdown", "md"],
    ["csv", "csv"],
    ["base64", "b64"],
    ["text", "txt"],
  ] as const)("names %s files appropriately", (format, extension) => {
    expect(createTextDownload("value", { format }).fileName).toBe(`output.${extension}`);
  });
  it("retains zero-valued metrics and multiline fields in reports", () => {
    expect(
      serializeResultFields([
        { label: "Count", value: "0" },
        { label: "Text", value: "a\nb" },
        { label: "Absent", value: "" },
      ])
    ).toBe("Count\n0\n\nText\na\nb");
  });
});
