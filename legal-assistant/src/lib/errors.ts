// One consistent error shape for both API routes.
// The browser only ever sees the friendly `message`; technical details are
// logged on the server and never sent to the client.

export type ErrorCode =
  | "invalid_request"
  | "payload_too_large"
  | "rate_limited"
  | "server_config"
  | "model_unavailable"
  | "ai_busy"
  | "timeout"
  | "blocked"
  | "unable_to_draft"
  | "incomplete"
  | "pdf_unsupported_chars"
  | "pdf_failed"
  | "unknown";

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    fieldErrors?: Record<string, string>;
  };
}

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number,
    public readonly options: {
      fieldErrors?: Record<string, string>;
      retryAfterSeconds?: number;
    } = {},
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** Turn anything thrown inside a route into a safe JSON response. */
export function toErrorResponse(error: unknown): Response {
  const appError =
    error instanceof AppError
      ? error
      : new AppError(
          "unknown",
          "Something went wrong on our side. Please try again in a moment.",
          500,
        );

  if (!(error instanceof AppError)) {
    // Log the type only, never user content.
    console.error("Unexpected error:", error instanceof Error ? error.name : typeof error);
  }

  const body: ApiErrorBody = {
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.options.fieldErrors
        ? { fieldErrors: appError.options.fieldErrors }
        : {}),
    },
  };

  const headers: Record<string, string> = {};
  if (appError.options.retryAfterSeconds) {
    headers["Retry-After"] = String(appError.options.retryAfterSeconds);
  }
  return Response.json(body, { status: appError.status, headers });
}
