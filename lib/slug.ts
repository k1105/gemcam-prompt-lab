import { randomBytes } from "crypto";

// URL-safe base62 alphabet (no look-alikes excluded — collision space is huge).
const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const DEFAULT_LEN = 12;

export function generateShareSlug(length = DEFAULT_LEN): string {
  const buf = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[buf[i] % ALPHABET.length];
  }
  return out;
}
