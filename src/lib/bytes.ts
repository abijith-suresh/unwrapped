export function bytesToHex(bytes: Uint8Array, separator: string = ""): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(separator);
}
