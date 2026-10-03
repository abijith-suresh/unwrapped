import { describe, expect, it } from "vitest";

import { HTTP_STATUS_CODES, searchHttpStatusCodes } from "./httpStatusCodes";

describe("HTTP_STATUS_CODES", () => {
  it("covers representative status classes", () => {
    expect(HTTP_STATUS_CODES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 200, category: "Success", name: "OK" }),
        expect.objectContaining({ code: 301, category: "Redirection", name: "Moved Permanently" }),
        expect.objectContaining({ code: 404, category: "Client Error", name: "Not Found" }),
        expect.objectContaining({
          code: 422,
          category: "Client Error",
          name: "Unprocessable Content",
        }),
        expect.objectContaining({
          code: 500,
          category: "Server Error",
          name: "Internal Server Error",
        }),
      ])
    );
  });
});

describe("searchHttpStatusCodes", () => {
  it("finds entries by numeric code", () => {
    expect(searchHttpStatusCodes("404").map((entry) => entry.code)).toEqual([404]);
  });

  it("finds entries by standard name", () => {
    expect(searchHttpStatusCodes("unprocessable")).toEqual([
      expect.objectContaining({ code: 422, name: "Unprocessable Content" }),
    ]);
  });

  it("finds entries by category text", () => {
    expect(searchHttpStatusCodes("redirect").map((entry) => entry.code)).toEqual([
      300, 301, 302, 303, 304, 305, 307, 308,
    ]);
  });
});
