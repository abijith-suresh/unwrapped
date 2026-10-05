import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_IMPORT_WARN_BYTES,
  evaluateFileImportPolicy,
  readImportedFile,
} from "./fileImport";

afterEach(() => vi.restoreAllMocks());

describe("file import utilities", () => {
  it("returns a warning decision for files above the warning threshold", () => {
    expect(evaluateFileImportPolicy({ size: DEFAULT_IMPORT_WARN_BYTES + 1 })).toEqual({
      status: "warn",
      warnBytes: DEFAULT_IMPORT_WARN_BYTES,
    });
  });

  it("reads text files and keeps the size decision", async () => {
    const file = new File(["hello world"], "hello.txt", { type: "text/plain" });
    const result = await readImportedFile(file, { as: "text" });

    expect(result).toEqual({
      ok: true,
      file: {
        name: "hello.txt",
        size: 11,
        type: "text/plain",
      },
      value: "hello world",
      decision: { status: "accept" },
    });
  });

  it("reads binary files as byte arrays", async () => {
    const file = new File([new Uint8Array([72, 73])], "hello.bin", {
      type: "application/octet-stream",
    });
    const result = await readImportedFile(file, { as: "bytes" });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("expected byte read to succeed");
    }

    expect(result.file).toEqual({
      name: "hello.bin",
      size: 2,
      type: "application/octet-stream",
    });
    expect(Array.from(result.value)).toEqual([72, 73]);
  });

  it("returns a typed oversize error before reading", async () => {
    const file = new File(["12345"], "big.txt", { type: "text/plain" });
    const read = vi.spyOn(file, "text");
    const result = await readImportedFile(file, {
      as: "text",
      policy: { maxBytes: 4 },
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "file-too-large",
        file: {
          name: "big.txt",
          size: 5,
          type: "text/plain",
        },
        maxBytes: 4,
      },
    });
    expect(read).not.toHaveBeenCalled();
  });

  it("returns a typed read error when file reading fails", async () => {
    const file = new File(["hello"], "broken.txt", { type: "text/plain" });
    Object.defineProperty(file, "text", {
      value: () => Promise.reject(new Error("disk offline")),
    });

    const result = await readImportedFile(file, { as: "text" });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "read-failed",
        file: {
          name: "broken.txt",
          size: 5,
          type: "text/plain",
        },
        message: "disk offline",
      },
    });
  });
});
