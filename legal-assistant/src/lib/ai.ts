import "server-only";
import { ApiError, FinishReason, GoogleGenAI } from "@google/genai";
import { assertUsableDraft, cleanDraftText } from "./draftText";
import { AppError } from "./errors";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import type { DraftRequest } from "./schemas";

// This is the ONLY file that talks to the AI provider. The key is read from
// a server-only environment variable (no NEXT_PUBLIC_ prefix) and the
// "server-only" import above makes the build fail if a browser file ever
// imports this one by mistake.

// Gemini 2.5 models are scheduled to shut down in October 2026, so the
// default is a Gemini 3 model. Override with GEMINI_MODEL in .env.local.
const DEFAULT_MODEL = "gemini-3.1-flash-lite";
const REQUEST_TIMEOUT_MS = 45_000;
const MAX_OUTPUT_TOKENS = 8192;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set.");
    throw new AppError(
      "server_config",
      "AI drafting isn't set up on this server yet. The site owner needs to add a Gemini API key.",
      500,
    );
  }
  return new GoogleGenAI({ apiKey });
}

/** Translate provider failures into messages a normal person can act on. */
function mapProviderError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof ApiError) {
    // Log the status only. Never log the prompt or the user's text.
    console.error("Gemini API error, status:", error.status);
    switch (error.status) {
      case 400:
      case 401:
      case 403:
        return new AppError(
          "server_config",
          "The AI service rejected our credentials. The site owner should check the Gemini API key.",
          500,
        );
      case 404:
        return new AppError(
          "model_unavailable",
          "The configured AI model isn't available. The site owner should check the GEMINI_MODEL setting.",
          500,
        );
      case 429:
        return new AppError(
          "ai_busy",
          "The AI service is receiving too many requests right now. Please wait a minute and try again.",
          429,
          { retryAfterSeconds: 60 },
        );
      default:
        return new AppError(
          "ai_busy",
          "The AI service is busy or unavailable. Please try again in a moment.",
          503,
        );
    }
  }

  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  console.error("Gemini call failed:", name || typeof error);
  if (name === "AbortError" || message.includes("timeout") || message.includes("timed out")) {
    return new AppError(
      "timeout",
      "The AI took too long to answer. Your form is still filled in, so please try again.",
      504,
    );
  }
  return new AppError(
    "unknown",
    "We couldn't reach the AI service. Please try again in a moment.",
    502,
  );
}

/** Ask Gemini for the document body and return clean, checked plain text. */
export async function generateDraft(request: DraftRequest): Promise<string> {
  const ai = getClient();
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: buildUserPrompt(request),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.3,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        httpOptions: { timeout: REQUEST_TIMEOUT_MS },
      },
    });
  } catch (error) {
    throw mapProviderError(error);
  }

  if (response.promptFeedback?.blockReason) {
    throw new AppError(
      "blocked",
      "The AI service declined to process these details. Reword the purpose or extra details and try again.",
      422,
    );
  }

  const candidate = response.candidates?.[0];
  if (candidate?.finishReason === FinishReason.MAX_TOKENS) {
    throw new AppError(
      "incomplete",
      "The draft was cut off because it got too long. Shorten the purpose or extra details and try again.",
      502,
    );
  }
  if (
    candidate?.finishReason &&
    candidate.finishReason !== FinishReason.STOP
  ) {
    throw new AppError(
      "blocked",
      "The AI service stopped before finishing the draft. Reword your details and try again.",
      422,
    );
  }

  const text = cleanDraftText(response.text ?? "");
  assertUsableDraft(text);
  return text;
}
