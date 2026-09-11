import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { tools } from "../src/tools/registry.ts";

const FRAME_WIDTH = 1200;
const FRAME_HEIGHT = 630;
const SANS_FONT_FAMILY = "Manrope Variable";
const MONO_FONT_FAMILY = "JetBrains Mono";

const COLORS = {
  page: "#0b0d10",
  surface: "#13161b",
  accent: "#6f8cff",
  text: "#f1f2f4",
  secondary: "#b2b6bf",
  muted: "#7e8590",
  border: "#2b3038",
} as const;

const fontPaths = {
  sans: join(
    import.meta.dir,
    "../node_modules/@fontsource/manrope/files/manrope-latin-400-normal.woff"
  ),
  sansBold: join(
    import.meta.dir,
    "../node_modules/@fontsource/manrope/files/manrope-latin-700-normal.woff"
  ),
  mono: join(
    import.meta.dir,
    "../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff"
  ),
} as const;

const outPath = join(import.meta.dir, "../public/og-image.png");
const sansFontData = readFileSync(fontPaths.sans);
const sansBoldFontData = readFileSync(fontPaths.sansBold);
const monoFontData = readFileSync(fontPaths.mono);

interface SatoriElement {
  type: string;
  props: {
    style?: Record<string, unknown>;
    children?: unknown;
  };
}

function element(
  type: string,
  style: Record<string, unknown>,
  children: unknown = ""
): SatoriElement {
  return {
    type,
    props: { style, children },
  };
}

function createBrand(): SatoriElement {
  return element("div", { display: "flex", alignItems: "center", height: 36 }, [
    element("div", {
      width: 3,
      height: 30,
      borderRadius: 2,
      backgroundColor: COLORS.accent,
      marginRight: 12,
    }),
    element(
      "span",
      {
        color: COLORS.text,
        fontFamily: MONO_FONT_FAMILY,
        fontSize: 23,
        fontWeight: 700,
      },
      "unwrapped"
    ),
    element(
      "span",
      {
        color: COLORS.accent,
        fontFamily: MONO_FONT_FAMILY,
        fontSize: 23,
        fontWeight: 700,
      },
      ".tools"
    ),
  ]);
}

function createSearchIcon(): SatoriElement {
  return element("div", { display: "flex", position: "relative", width: 24, height: 24 }, [
    element("div", {
      position: "absolute",
      top: 2,
      left: 2,
      width: 12,
      height: 12,
      border: `3px solid ${COLORS.muted}`,
      borderRadius: 999,
    }),
    element("div", {
      position: "absolute",
      top: 15,
      left: 15,
      width: 8,
      height: 3,
      borderRadius: 2,
      backgroundColor: COLORS.muted,
      transform: "rotate(45deg)",
      transformOrigin: "left center",
    }),
  ]);
}

function createToolCard(tool: (typeof tools)[number]): SatoriElement {
  return element(
    "div",
    {
      display: "flex",
      flex: 1,
      minWidth: 0,
      height: 116,
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "16px 18px 15px",
      border: `1px solid ${COLORS.border}`,
      borderRadius: 7,
      backgroundColor: COLORS.surface,
    },
    [
      element(
        "div",
        {
          color: COLORS.muted,
          fontFamily: MONO_FONT_FAMILY,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        },
        tool.category
      ),
      element(
        "div",
        {
          color: COLORS.text,
          fontFamily: SANS_FONT_FAMILY,
          fontSize: 18,
          fontWeight: 700,
          lineHeight: 1.15,
        },
        tool.name
      ),
      element(
        "div",
        {
          overflow: "hidden",
          color: COLORS.secondary,
          fontFamily: SANS_FONT_FAMILY,
          fontSize: 11,
          lineHeight: 1.3,
          maxHeight: 29,
        },
        tool.description
      ),
    ]
  );
}

const previewTools = tools.slice(0, 6);

const tree: SatoriElement = element(
  "div",
  {
    display: "flex",
    width: `${FRAME_WIDTH}px`,
    height: `${FRAME_HEIGHT}px`,
    flexDirection: "column",
    padding: "48px 64px 40px",
    overflow: "hidden",
    backgroundColor: COLORS.page,
    fontFamily: SANS_FONT_FAMILY,
  },
  [
    element(
      "div",
      {
        display: "flex",
        width: "100%",
        height: 44,
        alignItems: "flex-start",
        paddingBottom: 15,
        borderBottom: `1px solid ${COLORS.border}`,
      },
      createBrand()
    ),
    element(
      "div",
      {
        display: "flex",
        alignItems: "baseline",
        marginTop: 38,
      },
      [
        element(
          "span",
          {
            color: COLORS.text,
            fontFamily: SANS_FONT_FAMILY,
            fontSize: 58,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1,
          },
          "Search tools"
        ),
        element(
          "span",
          {
            color: COLORS.accent,
            fontFamily: SANS_FONT_FAMILY,
            fontSize: 58,
            fontWeight: 700,
            lineHeight: 1,
          },
          "."
        ),
      ]
    ),
    element(
      "div",
      {
        display: "flex",
        width: "100%",
        height: 64,
        alignItems: "center",
        gap: 14,
        marginTop: 24,
        padding: "0 20px",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 9,
        backgroundColor: COLORS.surface,
      },
      [
        createSearchIcon(),
        element(
          "span",
          {
            flex: 1,
            color: COLORS.muted,
            fontFamily: SANS_FONT_FAMILY,
            fontSize: 15,
          },
          "Search a tool"
        ),
        element(
          "span",
          {
            padding: "5px 9px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 5,
            color: COLORS.muted,
            fontFamily: MONO_FONT_FAMILY,
            fontSize: 11,
          },
          "⌘K"
        ),
      ]
    ),
    element(
      "div",
      {
        display: "flex",
        flexDirection: "column",
        gap: 12,
        marginTop: 16,
      },
      [0, 1].map((row) =>
        element(
          "div",
          { display: "flex", gap: 12, height: 116 },
          previewTools.slice(row * 3, row * 3 + 3).map(createToolCard)
        )
      )
    ),
  ]
);

const svg = await satori(tree as Parameters<typeof satori>[0], {
  width: FRAME_WIDTH,
  height: FRAME_HEIGHT,
  fonts: [
    {
      name: SANS_FONT_FAMILY,
      data: sansFontData,
      weight: 400,
      style: "normal",
    },
    {
      name: SANS_FONT_FAMILY,
      data: sansBoldFontData,
      weight: 700,
      style: "normal",
    },
    {
      name: MONO_FONT_FAMILY,
      data: monoFontData,
      weight: 700,
      style: "normal",
    },
  ],
});

const resvg = new Resvg(svg, { fitTo: { mode: "width", value: FRAME_WIDTH } });
const pngBuffer = resvg.render().asPng();

writeFileSync(outPath, pngBuffer);
