import { describe, expect, it } from "vitest";
import { formatXml } from "@/lib/xmlFormatter";

function documentValues(source: string): unknown {
  const root = new DOMParser().parseFromString(source, "application/xml").documentElement;
  function read(node: Element): unknown {
    return {
      name: node.tagName,
      attributes: [...node.attributes].map((attr) => [attr.name, attr.value]),
      // Indentation between elements is allowed; text-bearing elements must stay exact.
      text: [...node.childNodes]
        .filter(
          (child) => child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE
        )
        .map((child) => child.textContent)
        .filter((text) => text?.trim()),
      children: [...node.children].map(read),
    };
  }
  return read(root);
}

describe("XML formatting", () => {
  it("indents element-only containers while keeping text elements inline", () => {
    expect(formatXml('<root><item id="1">value</item><empty /></root>', { indent: 2 })).toEqual({
      ok: true,
      output: '<root>\n  <item id="1">value</item>\n  <empty />\n</root>',
    });
  });

  it.each([
    '<root attr="a > b"><child /></root>',
    "<p>Hello <b>world</b>!</p>",
    '<root><p xml:space="preserve">  hello <b>world</b>  </p></root>',
    "<p>   </p>",
    "<p><![CDATA[a < b > c]]><child /></p>",
    '<root xmlns="urn:demo"><child value="&amp;">&lt;test&gt;</child></root>',
    '<?xml version="1.0"?><!DOCTYPE root><root><!--comment--><child /></root>',
  ])("preserves text and attributes, and is idempotent for %s", (source) => {
    const result = formatXml(source, { indent: 4 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(documentValues(result.output)).toEqual(documentValues(source));
    expect(formatXml(result.output, { indent: 4 })).toEqual(result);
    if (source === "<p>   </p>") expect(result.output).toBe(source);
  });

  it.each([
    "<a/><b/>",
    "<root><child></root>",
    '<root attr="broken></root>',
    "<root>&unknown;</root>",
    '<root attr="1" attr="2"/>',
  ])("rejects malformed documents %s", (source) => {
    expect(formatXml(source, { indent: 2 })).toMatchObject({
      ok: false,
      error: expect.stringContaining("XML"),
    });
  });
});
