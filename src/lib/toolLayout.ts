/** Page widths shared by the shell, loading states, and tool components. */
export const TOOL_WIDTHS = {
  narrow: "48rem",
  standard: "56rem",
  wide: "70rem",
  full: "100%",
} as const;

export type ToolWidth = keyof typeof TOOL_WIDTHS;
