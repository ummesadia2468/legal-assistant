import type { ApiErrorBody } from "./errors";
import type { DocumentTypeId } from "./documentTypes";
import type { DraftRequest } from "./schemas";

// Browser-side helpers for calling our own API routes.
// They never touch the AI provider and never see an API key.

/** An error whose message is safe and helpful to show directly to the person. */
export class UserFacingError extends Error {
  constructor(
    message: string,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "UserFacingError";
  }
}

async function readError(response: Response): Promise<UserFacingError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new UserFacingError(body.error.message, body.error.fieldErrors);
  } catch {
    return new UserFacingError(
      `Something went wrong (error ${response.status}). Please try again.`,
    );
  }
}

async function postJson(
  url: string,
  payload: unknown,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new UserFacingError(
        "This is taking longer than expected. Your details are still in the form, so please try again.",
      );
    }
    throw new UserFacingError(
      "Couldn't reach the server. Check your internet connection and try again.",
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function requestDraft(request: DraftRequest): Promise<string> {
  const response = await postJson("/api/draft", request, 60_000);
  if (!response.ok) throw await readError(response);
  const body = (await response.json()) as { draft: string };
  return body.draft;
}

export async function requestPdf(
  documentType: DocumentTypeId,
  content: string,
): Promise<Blob> {
  const response = await postJson(
    "/api/export-pdf",
    { documentType, content },
    30_000,
  );
  if (!response.ok) throw await readError(response);
  return response.blob();
}

/** Save a Blob to the person's computer with the given file name. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
