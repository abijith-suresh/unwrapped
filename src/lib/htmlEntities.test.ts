import { describe, expect, it } from "vitest";
import { transformEntities } from "./htmlEntities";

describe("HTML entities", () => {
  it("escapes markup and quoted attributes", () => {
    expect(transformEntities('<a title="x">&</a>', "encode")).toMatchObject({
      output: "&lt;a title=&quot;x&quot;&gt;&amp;&lt;/a&gt;",
    });
  });
  it("decodes named, decimal and hexadecimal entities once", () => {
    expect(transformEntities("&copy; &#169; &#x1F600; &amp;lt;", "decode")).toMatchObject({
      output: "© © 😀 &lt;",
    });
  });
  it("keeps unknown and unterminated entities", () => {
    expect(transformEntities("&unknown; &copy", "decode")).toMatchObject({
      output: "&unknown; &copy",
    });
  });
  it("round trips Unicode and returns empty output", () => {
    const encoded = transformEntities("© 😀 café", "encode", true);
    if (encoded.ok)
      expect(transformEntities(encoded.output, "decode")).toMatchObject({ output: "© 😀 café" });
    expect(transformEntities("", "encode")).toEqual({ ok: true, output: "" });
  });
});
