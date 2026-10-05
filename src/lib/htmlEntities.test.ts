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
  it("encodes non-ASCII only when requested", () => {
    expect(transformEntities("©", "encode")).toEqual({ ok: true, output: "©" });
    expect(transformEntities("©", "encode", true)).toEqual({ ok: true, output: "&copy;" });
  });
});
