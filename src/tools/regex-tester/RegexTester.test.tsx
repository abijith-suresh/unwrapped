import { fireEvent, render, waitFor, within } from "@solidjs/testing-library";
import { afterEach, expect, it, vi } from "vitest";
import * as clipboard from "@/lib/clipboard";
import * as download from "@/lib/download";
import { analyzeRegex } from "@/lib/regex";
import * as regexExecution from "@/lib/regexExecution";
import { setToolHandoffNavigator, toolHandoffs } from "@/lib/toolHandoff";
import RegexTester from "./RegexTester";

afterEach(() => {
  vi.restoreAllMocks();
  toolHandoffs.clear();
});

it("renders fixed capture columns and shares the complete report through copy, download and handoff", async () => {
  vi.spyOn(regexExecution, "createRegexAnalysisExecutor").mockReturnValue({
    cancel: vi.fn(),
    dispose: vi.fn(),
    execute: async (input) => ({ requestId: 1, result: analyzeRegex(input) }),
  });
  const copy = vi.spyOn(clipboard, "copyToClipboard").mockResolvedValue(true);
  const save = vi.spyOn(download, "downloadText").mockImplementation(() => {});
  const navigate = vi.fn(async () => {});
  setToolHandoffNavigator(navigate);
  const { container, getByRole } = render(() => (
    <div data-tool-id="regex-tester">
      <RegexTester />
    </div>
  ));
  fireEvent.input(getByRole("textbox", { name: "Pattern" }), {
    target: { value: "(?<named>(a))(?<other>a)(b)?(?<empty>)" },
  });
  fireEvent.input(getByRole("textbox", { name: "Test string" }), {
    target: { value: "aa aab" },
  });
  await waitFor(() => expect(container).toHaveTextContent("10 capture groups"));
  const table = getByRole("table", { name: "Capture groups" });
  expect(
    within(table)
      .getAllByRole("columnheader")
      .map((cell) => cell.textContent)
  ).toEqual([
    "Match #",
    "Full match",
    "Group 1",
    "Group 2",
    "Group 3",
    "Group 4",
    "Group 5",
    "named (alias)",
    "other (alias)",
    "empty (alias)",
  ]);
  const rows = within(table).getAllByRole("row").slice(1);
  expect(rows.map((row) => within(row).getAllByRole("cell").length)).toEqual([10, 10]);
  expect(
    rows.map((row) =>
      within(row)
        .getAllByRole("cell")
        .slice(2)
        .map((cell) => cell.textContent)
    )
  ).toEqual([
    ["a", "a", "a", "Unmatched", "Empty string", "a", "a", "Empty string"],
    ["a", "a", "a", "b", "Empty string", "a", "a", "Empty string"],
  ]);

  fireEvent.click(getByRole("button", { name: "Copy matches report" }));
  await waitFor(() => expect(copy).toHaveBeenCalledOnce());
  const report = copy.mock.calls[0]?.[0];
  expect(JSON.parse(report ?? "")).toEqual({
    matches: [
      {
        index: 0,
        fullMatch: "aa",
        groups: [
          { number: 1, value: "a" },
          { number: 2, value: "a" },
          { number: 3, value: "a" },
          { number: 4, value: null },
          { number: 5, value: "" },
        ],
        namedGroups: [
          { name: "named", value: "a" },
          { name: "other", value: "a" },
          { name: "empty", value: "" },
        ],
      },
      {
        index: 3,
        fullMatch: "aab",
        groups: [
          { number: 1, value: "a" },
          { number: 2, value: "a" },
          { number: 3, value: "a" },
          { number: 4, value: "b" },
          { number: 5, value: "" },
        ],
        namedGroups: [
          { name: "named", value: "a" },
          { name: "other", value: "a" },
          { name: "empty", value: "" },
        ],
      },
    ],
    summary: { captureGroupCount: 10, emptyMatchCount: 0, firstMatchIndex: 0 },
  });
  fireEvent.click(getByRole("button", { name: "Download matches" }));
  expect(save).toHaveBeenCalledWith(
    report,
    expect.objectContaining({ format: "json", fileName: "matches.json" })
  );
  fireEvent.change(getByRole("combobox", { name: "Open output in another tool" }), {
    target: { value: "json-formatter" },
  });
  await waitFor(() => expect(navigate).toHaveBeenCalledWith("/tools/json-formatter"));
  expect(toolHandoffs.consume("json-formatter")).toEqual({
    sourceId: "regex-tester",
    targetId: "json-formatter",
    format: "json",
    value: report,
  });
  fireEvent.click(getByRole("button", { name: "Copy match 2" }));
  await waitFor(() => expect(copy).toHaveBeenLastCalledWith("aab"));
});
