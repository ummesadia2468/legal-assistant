import "server-only";
import { AppError } from "./errors";

/**
 * Read a request body but stop as soon as it grows past `maxBytes`.
 * This protects the server from huge requests, even ones that don't
 * announce their size in advance.
 */
export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  const tooLarge = () =>
    new AppError(
      "payload_too_large",
      "That request is too large. Shorten your text and try again.",
      413,
    );

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw tooLarge();

  if (!request.body) {
    throw new AppError("invalid_request", "The request was empty.", 400);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw tooLarge();
    }
    chunks.push(value);
  }

  const text = new TextDecoder().decode(
    Buffer.concat(chunks.map((c) => Buffer.from(c))),
  );
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError("invalid_request", "The request was not valid JSON.", 400);
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "local";
}
