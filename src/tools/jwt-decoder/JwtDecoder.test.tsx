import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as clipboard from "@/lib/clipboard";
import { prettyJson } from "@/lib/jwt";
import { parseJson } from "@/lib/structuredData";
import { setToolHandoffNavigator, toolHandoffs } from "@/lib/toolHandoff";
import JsonFormatter from "@/tools/json-formatter/JsonFormatter";
import JwtDecoder from "./JwtDecoder";

const encode = (source: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(source)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
const tokenFor = (payload: string, header = '{"alg":"HS256","typ":"JWT"}', signature = "c2ln") =>
  `${encode(header)}.${encode(payload)}.${signature}`;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  toolHandoffs.clear();
});

describe("JWT inspector integration", () => {
  it("retains exact payload data through Copy, Download and Open in JSON Formatter", async () => {
    const source =
      '{"n":9007199254740993,"decimal":1.2300,"huge":1e500,"text":"雪 😀","__proto__":"user","constructor":"key","sub":"123","aud":["web","mobile"],"exp":1900000000.5}';
    const expected = prettyJson(parseJson(source));
    const copy = vi.spyOn(clipboard, "copyToClipboard").mockResolvedValue(true);
    const create = vi.fn<(blob: Blob) => string>(() => "blob:jwt-result");
    vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const navigate = vi.fn(async () => {});
    setToolHandoffNavigator(navigate);
    const view = render(() => (
      <div data-tool-id="jwt-decoder">
        <JwtDecoder />
      </div>
    ));
    fireEvent.input(view.getByRole("textbox", { name: "JWT token" }), {
      target: { value: tokenFor(source) },
    });
    expect(view.container.querySelectorAll("pre")[1].textContent).toBe(expected);
    expect(view.getByText("web, mobile")).toBeInTheDocument();
    expect(view.getByText(/^Not expired\. Expires at/)).toHaveTextContent("2030");
    expect(view.getByText(/^Signature not verified\./)).toBeInTheDocument();

    fireEvent.click(view.getByRole("button", { name: "Copy Payload" }));
    await waitFor(() => expect(copy).toHaveBeenCalledWith(expected));
    fireEvent.click(view.getByRole("button", { name: "Download results" }));
    expect(click).toHaveBeenCalledOnce();
    const blob = create.mock.calls[0][0];
    const downloaded = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsText(blob);
    });
    expect(downloaded).toContain(`Payload\n${expected}`);

    fireEvent.change(view.getAllByRole("combobox", { name: "Open output in another tool" })[1], {
      target: { value: "json-formatter" },
    });
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/tools/json-formatter"));
    view.unmount();
    const destination = render(() => <JsonFormatter />);
    await waitFor(() =>
      expect(destination.getByRole("textbox", { name: "JSON document" })).toHaveValue(expected)
    );
    expect(destination.container.querySelector("pre")?.textContent).toBe(expected);
    expect(toolHandoffs.consume("json-formatter")).toBeUndefined();
  });

  it("reports the offending JWT section and removes stale output actions, then recovers", () => {
    const view = render(() => <JwtDecoder />);
    const editor = view.getByRole("textbox", { name: "JWT token" });
    fireEvent.input(editor, { target: { value: tokenFor('{"sub":"Alice"}') } });
    expect(view.getByRole("button", { name: "Copy Payload" })).toBeEnabled();
    for (const [source, feedback] of [
      ["not JSON", "Payload:"],
      ['{"exp":1,"exp":2}', "Duplicate key"],
      ["[]", "Expected a JSON object"],
    ]) {
      fireEvent.input(editor, { target: { value: tokenFor(source) } });
      expect(view.getByRole("alert")).toHaveTextContent(feedback);
      expect(editor).toHaveAttribute("aria-describedby", view.getByRole("alert").id);
      expect(view.queryByRole("button", { name: "Copy Payload" })).not.toBeInTheDocument();
      expect(view.queryByRole("button", { name: "Download results" })).not.toBeInTheDocument();
    }
    fireEvent.input(editor, { target: { value: tokenFor('{"exp":1e500}') } });
    expect(view.queryByRole("alert")).not.toBeInTheDocument();
    expect(view.getByText(/^Expiration unknown\./)).toHaveTextContent("finite number");
    expect(view.container.querySelectorAll("pre")[1]).toHaveTextContent('"exp": 1e500');
    fireEvent.input(editor, { target: { value: tokenFor('{"exp":100}') } });
    expect(view.getByText(/^Expired at/)).toBeInTheDocument();
    fireEvent.input(editor, { target: { value: tokenFor("{}", '{"alg":"none"}', "") } });
    expect(view.getByText("Unsecured token. No signature or authentication.")).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Copy Payload" })).toBeEnabled();
  });
});
