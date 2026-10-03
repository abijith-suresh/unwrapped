import { describe, expect, it } from "vitest";
import { getThemeBootstrapScript } from "./theme";

function startVisit(now: number) {
  const page = document.implementation.createHTMLDocument("Visit");
  // Execute the exact script injected into the head, with a controlled clock.
  new Function("document", "Date", getThemeBootstrapScript())(page, { now: () => now });
  return page;
}

describe("site accent bootstrap", () => {
  it("chooses an accent before rendering and keeps the dark theme", () => {
    const page = startVisit(0);
    expect(page.documentElement.dataset.theme).toBe("dark");
    expect(page.documentElement.dataset.siteAccent).toBe("blue");
  });

  it("uses six-hour opening-time windows across the existing ten accent hues", () => {
    const interval = 6 * 60 * 60 * 1000;
    expect(startVisit(interval - 1).documentElement.dataset.siteAccent).toBe("blue");
    expect(startVisit(interval).documentElement.dataset.siteAccent).toBe("teal");
    expect(startVisit(interval - 1).documentElement.dataset.toolRotation).toBe("0");
    expect(startVisit(interval).documentElement.dataset.toolRotation).toBe("1");
    const accents = Array.from(
      { length: 10 },
      (_, index) => startVisit(index * interval).documentElement.dataset.siteAccent
    );
    expect(new Set(accents).size).toBe(10);
    expect(startVisit(10 * interval).documentElement.dataset.siteAccent).toBe("blue");
  });

  it("carries the opening accent into client navigation without recomputing it", () => {
    const page = startVisit(0);
    const destination = document.implementation.createHTMLDocument("Next tool");
    const swap = new Event("astro:before-swap");
    Object.defineProperty(swap, "newDocument", { value: destination });
    page.dispatchEvent(swap);
    expect(destination.documentElement.dataset.siteAccent).toBe("blue");
    expect(destination.documentElement.dataset.toolRotation).toBe("0");
  });
});
