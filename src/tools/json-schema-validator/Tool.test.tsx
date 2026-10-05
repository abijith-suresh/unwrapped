import { fireEvent, render, screen, waitFor } from "@solidjs/testing-library";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { EXAMPLE_JSON_SCHEMA, EXAMPLE_SCHEMA_DOCUMENT } from "@/lib/exampleData";
import * as jsonSchema from "@/lib/jsonSchema";
import { JSON_SCHEMA_TIMEOUT_MS, type JsonSchemaValidationInput } from "@/lib/jsonSchemaExecution";
import type { TextTransformResult } from "@/lib/text";
import { toolHandoffs } from "@/lib/toolHandoff";
import type { WorkerRequest, WorkerResponse } from "@/lib/workerExecution";
import Tool from "./Tool";

class ValidationWorker {
  static instances: ValidationWorker[] = [];
  onmessage: ((event: MessageEvent<WorkerResponse<TextTransformResult>>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;
  postMessage = vi.fn<(request: WorkerRequest<JsonSchemaValidationInput>) => void>();
  terminate = vi.fn();
  constructor() {
    ValidationWorker.instances.push(this);
  }
  respond(result?: TextTransformResult) {
    const request = this.postMessage.mock.calls.at(-1)?.[0];
    if (!request) throw new Error("No validation request");
    this.onmessage?.({
      data: {
        requestId: request.requestId,
        result: result ?? jsonSchema.validateJsonSchema(request.input.input, request.input.schema),
      },
    } as MessageEvent);
  }
}

beforeEach(() => {
  ValidationWorker.instances = [];
  vi.stubGlobal("Worker", ValidationWorker);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  toolHandoffs.clear();
});

function setup() {
  const view = render(() => <Tool />);
  fireEvent.input(screen.getByLabelText("JSON"), { target: { value: EXAMPLE_SCHEMA_DOCUMENT } });
  fireEvent.input(screen.getByLabelText("Draft-07 schema"), {
    target: { value: EXAMPLE_JSON_SCHEMA },
  });
  const start = () => fireEvent.click(screen.getByRole("button", { name: "Validate document" }));
  return { ...view, start };
}

it("sends both inputs to the worker and clears validated results after edits", async () => {
  const { start } = setup();
  start();
  expect(screen.getByText("Validating…")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Copy result" })).toBeNull();
  const worker = ValidationWorker.instances[0];
  expect(worker.postMessage).toHaveBeenLastCalledWith({
    requestId: 1,
    input: {
      input: EXAMPLE_SCHEMA_DOCUMENT,
      schema: EXAMPLE_JSON_SCHEMA,
    },
  });
  worker.respond();
  await screen.findByText("Valid. The document matches the schema.");
  expect(screen.getByRole("button", { name: "Download validation result" })).toBeInTheDocument();
  fireEvent.input(screen.getByLabelText("JSON"), { target: { value: "{}" } });
  expect(screen.queryByText("Valid. The document matches the schema.")).toBeNull();
  expect(screen.queryByRole("button", { name: "Download validation result" })).toBeNull();
  start();
  worker.respond();
  await screen.findByText(/must have required property 'name'/);
  fireEvent.input(screen.getByLabelText("Draft-07 schema"), { target: { value: "{" } });
  start();
  worker.respond();
  await screen.findByText("Invalid schema JSON.");
});

it.each(["JSON", "Draft-07 schema", "Cancel validation", "Clear inputs", "replace", "unmount"])(
  "terminates active validation on %s and ignores a late result",
  async (action) => {
    const { start, unmount } = setup();
    start();
    const worker = ValidationWorker.instances[0];
    const lateMessage = worker.onmessage;
    if (action === "JSON" || action === "Draft-07 schema")
      fireEvent.input(screen.getByLabelText(action), { target: { value: "{}" } });
    else if (action === "replace") start();
    else if (action === "unmount") unmount();
    else fireEvent.click(screen.getByRole("button", { name: action }));
    expect(worker.terminate).toHaveBeenCalledOnce();
    lateMessage?.({
      data: { requestId: 1, result: { ok: true, output: "Stale result" } },
    } as MessageEvent);
    await Promise.resolve();
    expect(screen.queryByText("Stale result")).toBeNull();
    if (action === "replace") {
      expect(screen.getByText("Validating…")).toBeInTheDocument();
      ValidationWorker.instances[1].respond();
      await screen.findByText("Valid. The document matches the schema.");
    } else {
      expect(screen.queryByText("Validating…")).toBeNull();
      if (action === "Cancel validation") {
        expect(screen.getByText(/Validation cancelled/)).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Copy result" })).toBeNull();
        start();
        ValidationWorker.instances[1].respond();
        await screen.findByText("Valid. The document matches the schema.");
      }
    }
  }
);

it("terminates at the documented deadline and recovers on a fresh worker", async () => {
  vi.useFakeTimers();
  const { start } = setup();
  start();
  await vi.advanceTimersByTimeAsync(JSON_SCHEMA_TIMEOUT_MS);
  expect(ValidationWorker.instances[0].terminate).toHaveBeenCalledOnce();
  expect(screen.getByText(/Validation exceeded the 5-second limit/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Copy result" })).toBeNull();
  start();
  ValidationWorker.instances[1].respond();
  await Promise.resolve();
  expect(screen.getByText("Valid. The document matches the schema.")).toBeInTheDocument();
});

it.each(["unavailable", "construction", "crash"])(
  "reports worker %s without synchronous validation",
  async (failure) => {
    const { start } = setup();
    // Keep this fixture short enough to finish even if a synchronous fallback regresses.
    const synchronousValidation = vi.spyOn(jsonSchema, "validateJsonSchema");
    fireEvent.input(screen.getByLabelText("JSON"), {
      target: { value: JSON.stringify(`${"a".repeat(18)}!`) },
    });
    fireEvent.input(screen.getByLabelText("Draft-07 schema"), {
      target: { value: '{"type":"string","pattern":"^(a+)+$"}' },
    });
    if (failure === "unavailable") vi.stubGlobal("Worker", undefined);
    if (failure === "construction")
      vi.stubGlobal(
        "Worker",
        class {
          constructor() {
            throw new Error("Unavailable");
          }
        }
      );
    start();
    if (failure === "crash")
      ValidationWorker.instances[0].onerror?.(new Event("error") as ErrorEvent);
    await screen.findByText(
      failure === "crash" ? /Background validation failed/ : /Background validation is unavailable/
    );
    expect(screen.queryByRole("button", { name: "Download validation result" })).toBeNull();
    expect(synchronousValidation).not.toHaveBeenCalled();
  }
);

it("receives JSON through the memory-only handoff and validates it in the worker", async () => {
  toolHandoffs.prepare({
    sourceId: "json-formatter",
    targetId: "json-schema-validator",
    value: '{"n":2}',
    format: "json",
  });
  render(() => <Tool />);
  await waitFor(() => expect(screen.getByLabelText("JSON")).toHaveValue('{"n":2}'));
  fireEvent.input(screen.getByLabelText("Draft-07 schema"), {
    target: { value: '{"type":"object"}' },
  });
  fireEvent.click(screen.getByRole("button", { name: "Validate document" }));
  ValidationWorker.instances[0].respond();
  await screen.findByText("Valid. The document matches the schema.");
  expect(toolHandoffs.consume("json-schema-validator")).toBeUndefined();
});

it("never substitutes bundled examples into partially entered inputs", async () => {
  render(() => <Tool />);
  const input = screen.getByLabelText("JSON");
  const schema = screen.getByLabelText("Draft-07 schema");
  const validate = screen.getByRole("button", { name: "Validate document" });
  expect(input).toHaveValue("");
  expect(schema).toHaveValue("");
  expect(validate).toBeDisabled();
  expect(ValidationWorker.instances).toHaveLength(0);
  fireEvent.input(input, { target: { value: EXAMPLE_SCHEMA_DOCUMENT } });
  expect(screen.queryByText("Valid. The document matches the schema.")).toBeNull();
  fireEvent.click(validate);
  ValidationWorker.instances[0].respond();
  expect(await screen.findByRole("alert")).toHaveTextContent("Invalid schema JSON.");
  fireEvent.input(schema, { target: { value: EXAMPLE_JSON_SCHEMA } });
  fireEvent.click(validate);
  ValidationWorker.instances[0].respond();
  await screen.findByText("Valid. The document matches the schema.");
  fireEvent.click(screen.getByRole("button", { name: "Clear inputs" }));
  expect(input).toHaveValue("");
  expect(schema).toHaveValue("");
  expect(screen.getByRole("note", { name: "Example output" })).toBeInTheDocument();
  fireEvent.input(schema, { target: { value: "true" } });
  fireEvent.click(validate);
  ValidationWorker.instances[0].respond();
  expect(await screen.findByRole("alert")).toHaveTextContent("Invalid JSON document.");
});
