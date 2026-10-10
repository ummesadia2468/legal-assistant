"use client";

import { useEffect, useRef, useState } from "react";
import {
  DOCUMENT_TYPES,
  type DocumentTypeId,
} from "@/lib/documentTypes";
import {
  UserFacingError,
  downloadBlob,
  requestDraft,
  requestPdf,
} from "@/lib/apiClient";
import { buildPdfFilename, slugify } from "@/lib/filename";
import {
  findUnsupportedChars,
  normalizeForPdf,
  unsupportedCharsMessage,
} from "@/lib/pdfSupport";
import {
  EMPTY_FORM,
  LIMITS,
  validateDraftRequest,
  type FieldErrors,
  type FieldName,
  type FormValues,
} from "@/lib/schemas";
import DocumentForm from "./DocumentForm";
import DocumentPreview from "./DocumentPreview";

// Order used to move keyboard focus to the first field with a problem.
const FIELD_ORDER: FieldName[] = [
  "partyOne",
  "partyTwo",
  "jurisdiction",
  "purpose",
  "extraDetails",
];

/** The document currently on the page. `text` is whatever the person has edited it to. */
interface Draft {
  documentType: DocumentTypeId;
  partyOne: string;
  text: string;
  edited: boolean;
}

/**
 * Holds all the screen's state: the form, the current draft text, and the
 * loading and error states. The browser only talks to our own /api routes.
 */
export default function Workspace() {
  const [documentType, setDocumentType] = useState<DocumentTypeId>("nda");
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const config = DOCUMENT_TYPES[documentType];

  // Warn before closing the tab, because nothing is saved on the server.
  useEffect(() => {
    if (!draft) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [draft]);

  /** On phones the preview sits below the form, so bring it into view. */
  function showPreviewOnSmallScreens() {
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    previewRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }

  function handleFieldChange(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleGenerate() {
    if (isGenerating) return;

    const result = validateDraftRequest(documentType, values);
    if (!result.ok) {
      setErrors(result.errors);
      setNotice(null);
      const firstBad = FIELD_ORDER.find((field) => result.errors[field]);
      if (firstBad) {
        requestAnimationFrame(() =>
          document.getElementById(`field-${firstBad}`)?.focus(),
        );
      }
      return;
    }

    if (
      draft?.edited &&
      !window.confirm(
        "Generating a new draft will replace the text you edited. Continue?",
      )
    ) {
      return;
    }

    setErrors({});
    setError(null);
    setNotice(null);
    setIsGenerating(true);
    showPreviewOnSmallScreens();

    try {
      const text = await requestDraft(result.data);
      setDraft({
        documentType,
        partyOne: result.data.partyOne,
        text,
        edited: false,
      });
      setNotice(
        "Draft ready. Replace every [PLACEHOLDER] with the real detail, edit anything you like, and have a qualified attorney review it before use.",
      );
    } catch (caught) {
      // An existing draft is kept, so a failed retry never loses work.
      if (caught instanceof UserFacingError) {
        setError(caught.message);
        if (caught.fieldErrors) setErrors(caught.fieldErrors as FieldErrors);
      } else {
        setError("Something unexpected happened. Please try again.");
      }
    } finally {
      setIsGenerating(false);
      showPreviewOnSmallScreens();
    }
  }

  async function handleExport() {
    if (!draft || isExporting) return;
    setError(null);
    setNotice(null);

    if (draft.text.length > LIMITS.draftText) {
      setError(
        `The document is longer than ${LIMITS.draftText.toLocaleString("en-US")} characters. Shorten it and try again.`,
      );
      return;
    }
    const unsupported = findUnsupportedChars(normalizeForPdf(draft.text));
    if (unsupported.length > 0) {
      setError(unsupportedCharsMessage(unsupported));
      return;
    }

    setIsExporting(true);
    try {
      const blob = await requestPdf(draft.documentType, draft.text);
      const typeConfig = DOCUMENT_TYPES[draft.documentType];
      const filename = buildPdfFilename(
        slugify(typeConfig.label),
        draft.partyOne,
      );
      downloadBlob(blob, filename);
      setNotice(`PDF downloaded as ${filename}.`);
    } catch (caught) {
      setError(
        caught instanceof UserFacingError
          ? caught.message
          : "We couldn't create the PDF. Your text is still here, so please try again.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(320px,26rem)_1fr] lg:items-start">
      <DocumentForm
        config={config}
        documentType={documentType}
        values={values}
        errors={errors}
        isBusy={isGenerating}
        onTypeChange={(id) => {
          setDocumentType(id);
          setNotice(null);
        }}
        onFieldChange={handleFieldChange}
        onSubmit={handleGenerate}
      />
      <div ref={previewRef} className="min-w-0 scroll-mt-4">
        <DocumentPreview
          draft={
            draft
              ? {
                  heading: DOCUMENT_TYPES[draft.documentType].label,
                  text: draft.text,
                }
              : null
          }
          emptyHeading={config.label}
          isGenerating={isGenerating}
          isExporting={isExporting}
          error={error}
          notice={notice}
          onTextChange={(text) =>
            setDraft((current) =>
              current ? { ...current, text, edited: true } : current,
            )
          }
          onExport={handleExport}
        />
      </div>
    </div>
  );
}
