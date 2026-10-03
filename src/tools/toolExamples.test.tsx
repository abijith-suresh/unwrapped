import { webcrypto } from "node:crypto";
import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as hash from "@/lib/hash";
import Base64Tool from "@/tools/base64/Base64Tool";
import CaseConverter from "@/tools/case-converter/CaseConverter";
import DiffTool from "@/tools/diff/DiffTool";
import HashGenerator from "@/tools/hash-generator/HashGenerator";
import HmacGeneratorTool from "@/tools/hmac-generator/HmacGeneratorTool";
import JsonFormatter from "@/tools/json-formatter/JsonFormatter";
import JwtDecoder from "@/tools/jwt-decoder/JwtDecoder";
import RegexTester from "@/tools/regex-tester/RegexTester";
import TextStatisticsTool from "@/tools/text-statistics/TextStatisticsTool";
import TimestampTool from "@/tools/timestamp/TimestampTool";
import UrlEncoderTool from "@/tools/url-encoder/UrlEncoderTool";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Example output", () => {
  it.each([
    {
      name: "JSON formatter",
      Tool: JsonFormatter,
      label: "JSON document",
      example: '"name": "Alice"',
      input: '{"user":"Ada"}',
      output: '"user": "Ada"',
    },
    {
      name: "Base64",
      Tool: Base64Tool,
      label: "Plain text",
      example: "SGVsbG8sIHdvcmxkIQ==",
      input: "Ada",
      output: "QWRh",
    },
    {
      name: "Case converter",
      Tool: CaseConverter,
      label: "Source text",
      example: "helloWorld",
      input: "user_name",
      output: "userName",
    },
    {
      name: "JWT decoder",
      Tool: JwtDecoder,
      label: "JWT token",
      example: '"name": "Alice"',
      input: "e30.eyJzdWIiOiJhZGEifQ.c2ln",
      output: '"sub": "ada"',
    },
  ])(
    "$name replaces and restores examples without filling the input",
    async ({ Tool, label, example, input, output }) => {
      const { container, getByRole, queryByRole, queryAllByRole } = render(() => <Tool />);
      const editor = getByRole("textbox", { name: label });
      expect(editor).toHaveValue("");
      await waitFor(() => expect(container).toHaveTextContent(example));
      expect(getByRole("note", { name: "Example output" })).toBeInTheDocument();
      expect(queryAllByRole("button", { name: /^Copy/ })).toHaveLength(0);

      fireEvent.input(editor, { target: { value: input } });
      await waitFor(() => expect(container).toHaveTextContent(output));
      expect(container).not.toHaveTextContent(example);
      expect(queryByRole("note")).not.toBeInTheDocument();
      expect(queryAllByRole("button", { name: /^Copy/ }).length).toBeGreaterThan(0);

      fireEvent.input(editor, { target: { value: "" } });
      await waitFor(() => expect(container).toHaveTextContent(example));
      expect(editor).toHaveValue("");
      expect(getByRole("note", { name: "Example output" })).toBeInTheDocument();
      expect(queryAllByRole("button", { name: /^Copy/ })).toHaveLength(0);
    }
  );

  it("updates Base64 decode examples without exposing file actions", () => {
    const { container, getByRole, queryByRole } = render(() => <Base64Tool />);
    expect(getByRole("button", { name: /Swap/ })).toBeDisabled();
    fireEvent.click(getByRole("radio", { name: "Decode" }));
    expect(getByRole("textbox", { name: "Base64" })).toHaveAttribute(
      "placeholder",
      "SGVsbG8sIHdvcmxkIQ=="
    );
    expect(container.querySelector("pre")).toHaveTextContent("Hello, world!");
    fireEvent.click(getByRole("radio", { name: "Base64url" }));
    expect(getByRole("textbox", { name: "Base64url" })).toHaveAttribute(
      "placeholder",
      "SGVsbG8sIHdvcmxkIQ"
    );
    expect(container.querySelector("pre")).toHaveTextContent("Hello, world!");
    expect(queryByRole("radio", { name: "File / binary" })).not.toBeInTheDocument();
    expect(queryByRole("note")).toBeInTheDocument();
    expect(queryByRole("button", { name: "Download file" })).not.toBeInTheDocument();
    expect(container.querySelector("pre")).toHaveTextContent("Hello, world!");
  });

  it("keeps the URL encoding and decoding examples independent", () => {
    const { container, getByRole, getAllByRole, queryByRole } = render(() => <UrlEncoderTool />);
    expect(getAllByRole("note")).toHaveLength(2);
    fireEvent.input(getByRole("textbox", { name: "Plain text" }), {
      target: { value: "Ada + Bob" },
    });
    expect(container.querySelectorAll("pre")[0]).toHaveTextContent("Ada%20%2B%20Bob");
    expect(getAllByRole("note")).toHaveLength(1);
    expect(getByRole("button", { name: "Copy encoded" })).toBeEnabled();
    expect(queryByRole("button", { name: "Copy decoded" })).not.toBeInTheDocument();
    fireEvent.input(getByRole("textbox", { name: "Percent-encoded text" }), {
      target: { value: "%ZZ" },
    });
    expect(getByRole("alert")).toBeInTheDocument();
    expect(queryByRole("note")).not.toBeInTheDocument();
  });

  it("does not treat whitespace as an example in text statistics", () => {
    const { container, getByRole, queryByRole } = render(() => <TextStatisticsTool />);
    fireEvent.input(getByRole("textbox", { name: "Text input" }), { target: { value: " " } });
    expect(queryByRole("note")).not.toBeInTheDocument();
    expect([...container.querySelectorAll("strong")].map((node) => node.textContent)).toEqual([
      "1",
      "0",
      "1",
      "1",
    ]);
  });

  it("clears both timestamp inputs and never falls back to an example for invalid input", () => {
    const { container, getByRole, getAllByRole, queryByRole } = render(() => <TimestampTool />);
    const epoch = getByRole("textbox", { name: "Unix timestamp" });
    expect(container).toHaveTextContent("2023-11-14T22:13:20.000Z");
    expect(queryByRole("button", { name: "Copy ISO 8601" })).not.toBeInTheDocument();
    fireEvent.input(epoch, { target: { value: "1800000000" } });
    for (const copy of getAllByRole("button", { name: "Copy ISO 8601" }))
      expect(copy).toBeEnabled();
    fireEvent.input(epoch, { target: { value: "invalid" } });
    expect(queryByRole("note")).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent("2023-11-14T22:13:20.000Z");
    expect(queryByRole("button", { name: "Copy ISO 8601" })).not.toBeInTheDocument();
    fireEvent.input(epoch, { target: { value: "" } });
    expect(getByRole("note", { name: "Example output" })).toBeInTheDocument();
    expect(container.querySelector('input[type="datetime-local"]')).toHaveValue("");
  });

  it("switches regex replacement previews to actual inputs and back", async () => {
    const { container, getByRole, queryByRole } = render(() => <RegexTester />);
    fireEvent.click(getByRole("radio", { name: "Replace" }));
    expect(container).toHaveTextContent("[Hello], [world]!");
    expect(queryByRole("button", { name: "Copy replaced output" })).not.toBeInTheDocument();
    fireEvent.input(getByRole("textbox", { name: "Test string" }), { target: { value: "Ada" } });
    expect(queryByRole("note")).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent("[Hello], [world]!");
    fireEvent.input(getByRole("textbox", { name: "Pattern" }), { target: { value: "(Ada)" } });
    fireEvent.input(getByRole("textbox", { name: "Replacement" }), { target: { value: "Hi $1" } });
    await waitFor(() => expect(container).toHaveTextContent("Hi Ada"));
    for (const label of ["Test string", "Pattern", "Replacement"])
      fireEvent.input(getByRole("textbox", { name: label }), { target: { value: "" } });
    expect(getByRole("note", { name: "Example output" })).toBeInTheDocument();
    expect(container).toHaveTextContent("[Hello], [world]!");
  });

  it("compares example texts without putting them into the diff editors", async () => {
    const { container, getByRole, queryByRole } = render(() => <DiffTool />);
    const original = getByRole("textbox", { name: "Original text" });
    const modified = getByRole("textbox", { name: "Modified text" });
    expect(original).toHaveValue("");
    expect(modified).toHaveValue("");
    await waitFor(() => expect(container.querySelector("table")).toHaveTextContent("Version: 1"));
    fireEvent.input(original, { target: { value: "Ada" } });
    fireEvent.input(modified, { target: { value: "Bob" } });
    expect(queryByRole("note")).not.toBeInTheDocument();
    await waitFor(() => expect(container.querySelector("table")).toHaveTextContent("Ada"));
    expect(container.querySelector("table")).not.toHaveTextContent("Version: 1");
    fireEvent.input(original, { target: { value: "" } });
    fireEvent.input(modified, { target: { value: "" } });
    await waitFor(() => expect(container.querySelector("table")).toHaveTextContent("Version: 2"));
    expect(getByRole("note", { name: "Example output" })).toBeInTheDocument();
  });

  it("ignores a completed HMAC generation after the input changes", async () => {
    vi.stubGlobal("crypto", webcrypto);
    const { container, getByRole, queryByRole } = render(() => <HmacGeneratorTool />);
    await waitFor(() => expect(container.querySelector("pre")).toHaveTextContent(/^[a-f0-9]{64}$/));
    let complete!: (buffer: ArrayBuffer) => void;
    const signing = new Promise<ArrayBuffer>((resolve) => {
      complete = resolve;
    });
    const sign = vi.spyOn(webcrypto.subtle, "sign").mockReturnValueOnce(signing);
    fireEvent.input(getByRole("textbox", { name: "Message" }), { target: { value: "Ada" } });
    fireEvent.input(getByRole("textbox", { name: "Secret" }), { target: { value: "user-key" } });
    fireEvent.click(getByRole("button", { name: "Generate HMAC" }));
    await waitFor(() => expect(sign).toHaveBeenCalledOnce());
    fireEvent.input(getByRole("textbox", { name: "Message" }), { target: { value: "Bob" } });
    complete(new Uint8Array([0xab]).buffer);
    await signing;
    expect(container.querySelector("pre")).toHaveTextContent("—");
    expect(queryByRole("button", { name: "Copy HMAC" })).not.toBeInTheDocument();
  });

  it("keeps late hashes out of a restored example preview", async () => {
    const example = [{ algorithm: "SHA-256" as const, hex: "example-hash" }];
    const hashInput = vi.spyOn(hash, "hashTextWithAlgorithms").mockResolvedValue(example);
    const { container, getByRole, queryAllByRole } = render(() => <HashGenerator />);
    await waitFor(() => expect(container).toHaveTextContent("example-hash"));
    let complete!: (results: hash.HashResult[]) => void;
    const hashing = new Promise<hash.HashResult[]>((resolve) => {
      complete = resolve;
    });
    hashInput.mockReturnValueOnce(hashing);
    fireEvent.input(getByRole("textbox", { name: "Input text" }), { target: { value: "Ada" } });
    await waitFor(() => expect(hashInput).toHaveBeenCalledTimes(2));
    fireEvent.click(getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(hashInput).toHaveBeenCalledTimes(3));
    complete([{ algorithm: "SHA-256", hex: "old-user-hash" }]);
    await hashing;
    expect(getByRole("textbox", { name: "Input text" })).toHaveValue("");
    expect(container).toHaveTextContent("example-hash");
    expect(container).not.toHaveTextContent("old-user-hash");
    expect(queryAllByRole("button", { name: /^Copy/ })).toHaveLength(0);
  });
});
