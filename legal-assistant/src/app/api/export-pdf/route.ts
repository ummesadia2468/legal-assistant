import { DOCUMENT_TYPES } from "@/lib/documentTypes";
import { AppError, toErrorResponse } from "@/lib/errors";
import { isoDate, slugify } from "@/lib/filename";
import { renderDraftPdf } from "@/lib/pdf";
import {
  findUnsupportedChars,
  normalizeForPdf,
  unsupportedCharsMessage,
} from "@/lib/pdfSupport";
import { enforceRateLimit } from "@/lib/rateLimit";
import { getClientIp, readJsonBody } from "@/lib/requestGuards";
import { BODY_LIMITS, exportRequestSchema } from "@/lib/schemas";

// POST /api/export-pdf
// Receives the CURRENT edited text and returns a PDF file. No AI call here,
// so exporting again after an edit is free and fast.
export async function POST(request: Request) {
  try {
    enforceRateLimit(`pdf:${getClientIp(request)}`, 20);

    const body = await readJsonBody(request, BODY_LIMITS.exportPdf);
    const parsed = exportRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        "invalid_request",
        parsed.error.issues[0]?.message ?? "The document couldn't be exported.",
        400,
      );
    }

    const config = DOCUMENT_TYPES[parsed.data.documentType];
    const content = normalizeForPdf(parsed.data.content);

    const unsupported = findUnsupportedChars(content);
    if (unsupported.length > 0) {
      throw new AppError(
        "pdf_unsupported_chars",
        unsupportedCharsMessage(unsupported),
        422,
      );
    }

    let pdf: Buffer;
    try {
      pdf = await renderDraftPdf(config.label, content);
    } catch (error) {
      console.error("PDF render failed:", error instanceof Error ? error.name : typeof error);
      throw new AppError(
        "pdf_failed",
        "We couldn't create the PDF. Your text is still in the editor, so please try again.",
        500,
      );
    }

    const filename = `${slugify(config.label)}-${isoDate()}.pdf`;
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
