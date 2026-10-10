import { z } from "zod";
import { DOCUMENT_TYPE_IDS, type DocumentTypeId } from "./documentTypes";

// Size limits. They keep requests (and later, AI costs) reasonable.
// The server will reuse these exact numbers in Stage B.
export const LIMITS = {
  party: 120,
  jurisdiction: 120,
  purpose: 1000,
  extraDetails: 3000,
  /** Longest document (in characters) we will accept for PDF export. */
  draftText: 30000,
} as const;

// Maximum request sizes in bytes. Anything bigger is rejected before parsing.
export const BODY_LIMITS = {
  draft: 32 * 1024,
  exportPdf: 150 * 1024,
} as const;

export const draftRequestSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPE_IDS, {
    error: "Choose one of the available document types.",
  }),
  partyOne: z
    .string()
    .trim()
    .min(1, "Enter a name for the first party.")
    .max(LIMITS.party, `Keep this under ${LIMITS.party} characters.`),
  partyTwo: z
    .string()
    .trim()
    .min(1, "Enter a name for the second party.")
    .max(LIMITS.party, `Keep this under ${LIMITS.party} characters.`),
  jurisdiction: z
    .string()
    .trim()
    .min(1, "Enter a country, state or region (or write \"Not sure\").")
    .max(
      LIMITS.jurisdiction,
      `Keep this under ${LIMITS.jurisdiction} characters.`,
    ),
  purpose: z
    .string()
    .trim()
    .min(10, "Add a little more detail (at least 10 characters).")
    .max(LIMITS.purpose, `Keep this under ${LIMITS.purpose} characters.`),
  extraDetails: z
    .string()
    .trim()
    .max(
      LIMITS.extraDetails,
      `Keep this under ${LIMITS.extraDetails} characters.`,
    )
    .default(""),
});

export type DraftRequest = z.infer<typeof draftRequestSchema>;

/** The text fields in the form (everything except the document type). */
export type FieldName = Exclude<keyof DraftRequest, "documentType">;
export type FormValues = Record<FieldName, string>;
export type FieldErrors = Partial<Record<FieldName | "documentType", string>>;

export const EMPTY_FORM: FormValues = {
  partyOne: "",
  partyTwo: "",
  jurisdiction: "",
  purpose: "",
  extraDetails: "",
};

type ValidationResult =
  | { ok: true; data: DraftRequest }
  | { ok: false; errors: FieldErrors };

/**
 * Validate any input (a form on the client, a JSON body on the server) and
 * turn Zod's issues into one message per field.
 */
export function parseDraftRequest(input: unknown): ValidationResult {
  const result = draftRequestSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as FieldName | "documentType" | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}

/** Convenience wrapper used by the form. */
export function validateDraftRequest(
  documentType: DocumentTypeId,
  values: FormValues,
): ValidationResult {
  return parseDraftRequest({ documentType, ...values });
}

/** What the browser sends when exporting the (edited) document as a PDF. */
export const exportRequestSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPE_IDS, {
    error: "Choose one of the available document types.",
  }),
  content: z
    .string()
    .trim()
    .min(1, "There is no text to export yet.")
    .max(
      LIMITS.draftText,
      `The document is longer than ${LIMITS.draftText.toLocaleString("en-US")} characters. Shorten it and try again.`,
    ),
});

export type ExportRequest = z.infer<typeof exportRequestSchema>;
