// The PDF uses a built-in font (Times) that can draw Latin letters, digits
// and common punctuation, but not other writing systems or emoji.
// These helpers are shared: the browser checks before sending, and the server
// checks again before building the file.

const EXTRA_ALLOWED = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";

/** Swap look-alike characters the font lacks for plain equivalents. */
export function normalizeForPdf(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, "    ")
    .replace(/[\u2010-\u2012\u2212]/g, "-")
    .replace(/[\u2009\u200A\u202F\u00A0]/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

/** Characters in `text` that the PDF font cannot draw (already normalized text). */
export function findUnsupportedChars(text: string): string[] {
  const bad = new Set<string>();
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    const ok =
      code === 10 ||
      (code >= 32 && code <= 126) ||
      (code >= 160 && code <= 255) ||
      EXTRA_ALLOWED.includes(ch);
    if (!ok) bad.add(ch);
  }
  return [...bad];
}

export function unsupportedCharsMessage(chars: string[]): string {
  const shown = chars.slice(0, 8).join(" ");
  const more = chars.length > 8 ? " and others" : "";
  return `PDF export currently supports Latin letters only. Replace or remove these characters, then try again: ${shown}${more}`;
}
