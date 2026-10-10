import { generateDraft } from "@/lib/ai";
import { AppError, toErrorResponse } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rateLimit";
import { getClientIp, readJsonBody } from "@/lib/requestGuards";
import { BODY_LIMITS, parseDraftRequest } from "@/lib/schemas";

// POST /api/draft
// Browser -> this route -> Gemini. The API key never leaves the server.
export async function POST(request: Request) {
  try {
    enforceRateLimit(`draft:${getClientIp(request)}`, 8);

    const body = await readJsonBody(request, BODY_LIMITS.draft);

    // Validate again on the server: anyone can call this URL directly,
    // so the browser's checks cannot be trusted.
    const parsed = parseDraftRequest(body);
    if (!parsed.ok) {
      throw new AppError(
        "invalid_request",
        "Some details are missing or too long. Check the highlighted fields.",
        400,
        { fieldErrors: parsed.errors as Record<string, string> },
      );
    }

    const draft = await generateDraft(parsed.data);
    return Response.json(
      { draft, documentType: parsed.data.documentType },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
