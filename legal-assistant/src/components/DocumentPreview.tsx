import { LIMITS } from "@/lib/schemas";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";

export interface PreviewDraft {
  /** Title shown on the page. Taken from the draft, not from the current form choice. */
  heading: string;
  text: string;
}

interface DocumentPreviewProps {
  draft: PreviewDraft | null;
  /** Title to show in the empty state (follows the form's chosen type). */
  emptyHeading: string;
  isGenerating: boolean;
  isExporting: boolean;
  error: string | null;
  notice: string | null;
  onTextChange: (text: string) => void;
  onExport: () => void;
}

/**
 * The "paper" on the right: an empty state, a loading state, or the editable
 * draft. The text lives in the parent's state; this component only displays it.
 */
export default function DocumentPreview({
  draft,
  emptyHeading,
  isGenerating,
  isExporting,
  error,
  notice,
  onTextChange,
  onExport,
}: DocumentPreviewProps) {
  const length = draft?.text.length ?? 0;
  const overLimit = length > LIMITS.draftText;
  const canExport = Boolean(draft && draft.text.trim()) && !isGenerating && !isExporting;

  return (
    <section aria-labelledby="preview-heading" className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="preview-heading" className="text-sm font-semibold">
          Document preview
        </h2>
        <button
          type="button"
          onClick={onExport}
          disabled={!canExport}
          className="inline-flex items-center gap-2 rounded-sm border border-ink bg-paper px-4 py-2 text-sm font-semibold text-ink hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seal disabled:cursor-not-allowed disabled:border-rule disabled:bg-transparent disabled:text-ink-soft/60 disabled:hover:bg-transparent disabled:hover:text-ink-soft/60"
        >
          {isExporting ? (
            <>
              <LoadingSpinner /> Preparing PDF…
            </>
          ) : (
            "Export PDF"
          )}
        </button>
      </div>

      {error ? <ErrorMessage message={error} /> : null}
      <div role="status" aria-live="polite">
        {notice ? (
          <p className="mb-3 border-l-4 border-ink bg-note-bg px-3 py-2 text-sm text-ink">
            {notice}
          </p>
        ) : null}
      </div>

      <article
        aria-busy={isGenerating}
        className="relative mx-auto min-h-[28rem] max-w-3xl bg-paper px-6 py-10 shadow-[0_1px_2px_rgba(27,42,65,0.12),0_8px_24px_-8px_rgba(27,42,65,0.25)] sm:px-14 sm:py-14"
      >
        <p className="mb-8 border-b border-rule pb-2 text-sm text-ink-soft">
          Draft for review. Not legal advice.
        </p>
        <h3 className="font-doc text-2xl font-bold">
          {draft ? draft.heading : emptyHeading}
        </h3>

        {draft ? (
          <>
            <label htmlFor="draft-text" className="sr-only">
              Edit your draft. Replace every [PLACEHOLDER] with the real detail.
            </label>
            <textarea
              id="draft-text"
              value={draft.text}
              onChange={(e) => onTextChange(e.target.value)}
              readOnly={isGenerating}
              spellCheck
              className={`mt-6 block min-h-[32rem] w-full resize-y border-0 bg-transparent p-0 font-doc text-base leading-relaxed text-ink [field-sizing:content] focus:outline-2 focus:outline-offset-8 focus:outline-seal/60 ${isGenerating ? "opacity-40" : ""}`}
            />
            <p
              className={`mt-4 border-t border-rule pt-2 text-right text-sm tabular-nums ${overLimit ? "text-alert" : "text-ink-soft"}`}
            >
              {length.toLocaleString("en-US")} / {LIMITS.draftText.toLocaleString("en-US")} characters
            </p>
          </>
        ) : isGenerating ? null : (
          <p className="mt-6 font-doc text-base leading-relaxed text-ink-soft">
            Your draft will appear on this page. Choose a document type, fill in
            the form, and select Generate draft. You can then
            edit the text here before exporting it as a PDF.
          </p>
        )}

        {isGenerating ? (
          <div
            className={draft ? "absolute inset-x-0 top-40 flex justify-center" : "mt-6"}
          >
            <div className="flex items-center gap-3 bg-paper/95 px-4 py-2 text-sm text-ink">
              <LoadingSpinner className="h-5 w-5 text-seal" />
              <span>
                Writing your draft. This can take up to a minute.
              </span>
            </div>
          </div>
        ) : null}

        {isGenerating && !draft ? (
          <div className="mt-4 space-y-3" aria-hidden="true">
            {[92, 100, 85, 96, 70, 100, 88].map((width, i) => (
              <div
                key={i}
                className="h-3 animate-pulse rounded-sm bg-desk"
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}
