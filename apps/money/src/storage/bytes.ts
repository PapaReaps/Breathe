/** Turning bytes into text and back (base64), for keeping random values inside saved files. */

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let start = 0; start < bytes.length; start += chunk) {
    binary += String.fromCharCode(...bytes.subarray(start, start + chunk));
  }
  return btoa(binary);
}

/** Null if the value isn't base64 text of a sensible length. */
export function fromBase64(value: unknown, maxChars: number): Uint8Array<ArrayBuffer> | null {
  if (typeof value !== "string" || value.length > maxChars || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) return null;
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  } catch {
    return null;
  }
}
