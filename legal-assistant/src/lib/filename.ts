/** Turn any text into a safe, lowercase, hyphenated file name part. */
export function slugify(input: string, maxLength = 40): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

export function isoDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** e.g. non-disclosure-agreement-northwind-studio-2026-10-10.pdf */
export function buildPdfFilename(documentSlug: string, partyOne: string, date = new Date()): string {
  const parts = [documentSlug, slugify(partyOne, 30), isoDate(date)].filter(Boolean);
  return `${parts.join("-")}.pdf`;
}
