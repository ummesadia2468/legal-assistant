import { AppError } from "./errors";
import { UNABLE_TO_DRAFT } from "./prompts";

/** Models sometimes ignore "no Markdown". Strip the common leftovers. */
export function cleanDraftText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/^```[a-z]*\s*$/gim, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[*•]\s+/gm, "- ")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Check the model's answer is something we can safely show the user. */
export function assertUsableDraft(text: string): void {
  if (text.includes(UNABLE_TO_DRAFT)) {
    throw new AppError(
      "unable_to_draft",
      "The assistant couldn't write this document from the details given. Make the purpose more specific and try again.",
      422,
    );
  }
  if (text.length < 200) {
    throw new AppError(
      "incomplete",
      "The assistant returned a very short answer. Add more detail to the purpose and try again.",
      502,
    );
  }
}
