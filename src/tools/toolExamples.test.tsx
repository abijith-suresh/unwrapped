import { fireEvent, render, waitFor, within } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as hash from "@/lib/hash";
import * as hmac from "@/lib/hmac";
import { analyzeRegex } from "@/lib/regex";
import * as regexExecution from "@/lib/regexExecution";
import type { TextTransformResult } from "@/lib/text";
import HashGenerator from "@/tools/hash-generator/HashGenerator";
import HmacGeneratorTool from "@/tools/hmac-generator/HmacGeneratorTool";
import RegexTester from "@/tools/regex-tester/RegexTester";
import TextStatisticsTool from "@/tools/text-statistics/TextStatisticsTool";
import TimestampTool from "@/tools/timestamp/TimestampTool";
import UrlEncoderTool from "@/tools/url-encoder/UrlEncoderTool";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Tool state transitions", () => {
  it("keeps the URL encoding and decoding examples independent", () => {
    const { getByRole, queryByRole } = render(() => <UrlEncoderTool />);
    fireEvent.input(getByRole("textbox", { name: "Plain text" }), {
      target: { value: "Ada + Bob" },
    });
    expect(getByRole("region", { name: "Encoded output" })).toHaveTextContent("Ada%20%2B%20Bob");
    expect(getByRole("button", { name: "Copy encoded" })).toBeEnabled();
    expect(queryByRole("button", { name: "Copy decoded" })).not.toBeInTheDocument();
    fireEvent.input(getByRole("textbox", { name: "Percent-encoded text" }), {
      target: { value: "%ZZ" },
    });
    expect(getByRole("alert")).toBeInTheDocument();
    expect(getByRole("region", { name: "Encoded output" })).toHaveTextContent("Ada%20%2B%20Bob");
  });

  it("does not treat whitespace as an example in text statistics", () => {
    const { getByRole, queryByRole } = render(() => <TextStatisticsTool />);
    fireEvent.input(getByRole("textbox", { name: "Text input" }), { target: { value: " " } });
    expect(queryByRole("note")).not.toBeInTheDocument();
    for (const [label, value] of [
      ["Characters", "1"],
      ["Words", "0"],
      ["Lines", "1"],
      ["Bytes", "1"],
    ]) {
      expect(within(getByRole("region", { name: label })).getByText(value)).toBeInTheDocument();
    }
  });

  it("synchronizes timestamp inputs and clears the local date on invalid epochs", () => {
    const { getByRole, getByLabelText, queryByRole } = render(() => <TimestampTool />);
    const epoch = getByRole("textbox", { name: "Unix timestamp" });
    const local = getByLabelText("Date & time (local)");
    fireEvent.input(epoch, { target: { value: "1800000000" } });
    expect(local).not.toHaveValue("");
    expect(getByRole("button", { name: "Copy epoch seconds" })).toBeEnabled();
    fireEvent.input(epoch, { target: { value: "invalid" } });
    expect(local).toHaveValue("");
    expect(queryByRole("region", { name: "ISO 8601" })).not.toBeInTheDocument();
    expect(queryByRole("note", { name: "Example output" })).not.toBeInTheDocument();
    fireEvent.click(getByRole("button", { name: "Reset" }));
    expect(epoch).toHaveValue("");
    expect(local).toHaveValue("");
  });

  it("switches regex replacement previews to actual inputs and back", async () => {
    vi.spyOn(regexExecution, "createRegexAnalysisExecutor").mockReturnValue({
      cancel: vi.fn(),
      dispose: vi.fn(),
      execute: async (input) => ({ requestId: 1, result: analyzeRegex(input) }),
    });
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

  it("ignores a completed HMAC generation after the input changes", async () => {
    const generate = vi
      .spyOn(hmac, "generateHmac")
      .mockResolvedValue({ ok: true, output: "example-hmac" });
    const { getByRole, queryByRole } = render(() => <HmacGeneratorTool />);
    await waitFor(() =>
      expect(getByRole("region", { name: "Hex output" })).toHaveTextContent("example-hmac")
    );
    let complete!: (result: TextTransformResult) => void;
    const signing = new Promise<TextTransformResult>((resolve) => {
      complete = resolve;
    });
    generate.mockReturnValueOnce(signing);
    fireEvent.input(getByRole("textbox", { name: "Message" }), { target: { value: "Ada" } });
    fireEvent.input(getByRole("textbox", { name: "Secret" }), { target: { value: "user-key" } });
    fireEvent.click(getByRole("button", { name: "Generate HMAC" }));
    expect(generate).toHaveBeenLastCalledWith({
      message: "Ada",
      secret: "user-key",
      algorithm: "SHA-256",
    });
    fireEvent.input(getByRole("textbox", { name: "Message" }), { target: { value: "Bob" } });
    complete({ ok: true, output: "old-user-hmac" });
    await signing;
    expect(getByRole("region", { name: "Hex output" })).toHaveTextContent("—");
    expect(queryByRole("button", { name: "Copy HMAC" })).not.toBeInTheDocument();
  });

  it("keeps a newer hash when an older request finishes last", async () => {
    const hashInput = vi
      .spyOn(hash, "hashTextWithAlgorithms")
      .mockResolvedValue([{ algorithm: "SHA-256", hex: "example-hash" }]);
    const { getByRole } = render(() => <HashGenerator />);
    await waitFor(() =>
      expect(getByRole("region", { name: "SHA-256" })).toHaveTextContent("example-hash")
    );
    let complete!: (results: hash.HashResult[]) => void;
    const hashing = new Promise<hash.HashResult[]>((resolve) => {
      complete = resolve;
    });
    hashInput
      .mockReturnValueOnce(hashing)
      .mockResolvedValueOnce([{ algorithm: "SHA-256", hex: "bob-hash" }]);
    const input = getByRole("textbox", { name: "Input text" });
    fireEvent.input(input, { target: { value: "Ada" } });
    await waitFor(() => expect(hashInput).toHaveBeenLastCalledWith("Ada"));
    fireEvent.input(input, { target: { value: "Bob" } });
    await waitFor(() =>
      expect(getByRole("region", { name: "SHA-256" })).toHaveTextContent("bob-hash")
    );
    complete([{ algorithm: "SHA-256", hex: "old-user-hash" }]);
    await hashing;
    expect(
      within(getByRole("region", { name: "SHA-256" })).getByText("bob-hash")
    ).toBeInTheDocument();
  });
});
