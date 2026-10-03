export function getToolErrorMessage(error: unknown, isProd: boolean): string | null {
  if (isProd) {
    return null;
  }

  return error instanceof Error ? error.message : "Unknown tool error";
}
