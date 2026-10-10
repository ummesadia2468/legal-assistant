"use client";

import type { FormEvent, ReactNode } from "react";
import {
  DOCUMENT_TYPE_LIST,
  type DocumentTypeConfig,
  type DocumentTypeId,
} from "@/lib/documentTypes";
import {
  LIMITS,
  type FieldErrors,
  type FieldName,
  type FormValues,
} from "@/lib/schemas";
import LegalDisclaimer from "./LegalDisclaimer";
import LoadingSpinner from "./LoadingSpinner";

interface DocumentFormProps {
  config: DocumentTypeConfig;
  documentType: DocumentTypeId;
  values: FormValues;
  errors: FieldErrors;
  isBusy: boolean;
  onTypeChange: (id: DocumentTypeId) => void;
  onFieldChange: (field: FieldName, value: string) => void;
  onSubmit: () => void;
}

const inputClass =
  "block w-full rounded-sm border border-rule bg-paper px-3 py-2 text-base text-ink placeholder:text-ink-soft/60 focus:border-seal focus:outline-2 focus:outline-offset-1 focus:outline-seal aria-invalid:border-alert aria-invalid:bg-alert-bg/40";

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  counter?: ReactNode;
  children: ReactNode;
}

/** Label + hint + input + error message, wired together for screen readers. */
function FieldShell({ id, label, hint, error, counter, children }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="mb-2 text-sm text-ink-soft">
          {hint}
        </p>
      ) : null}
      {children}
      <div className="mt-1 flex items-start justify-between gap-3 text-sm">
        <p
          id={`${id}-error`}
          className="min-h-5 text-alert"
          role={error ? "alert" : undefined}
        >
          {error}
        </p>
        {counter}
      </div>
    </div>
  );
}

function describedBy(id: string, hasHint: boolean, hasError: boolean) {
  return [hasHint ? `${id}-hint` : null, hasError ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ") || undefined;
}

export default function DocumentForm({
  config,
  documentType,
  values,
  errors,
  isBusy,
  onTypeChange,
  onFieldChange,
  onSubmit,
}: DocumentFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  function textField(
    field: "partyOne" | "partyTwo" | "jurisdiction",
    label: string,
    placeholder: string,
    maxLength: number,
    hint?: string,
  ) {
    const id = `field-${field}`;
    return (
      <FieldShell id={id} label={label} hint={hint} error={errors[field]}>
        <input
          id={id}
          name={field}
          type="text"
          value={values[field]}
          placeholder={placeholder}
          // Hard stop slightly above the limit so pasted text is trimmed
          // by the browser but the validation message can still explain it.
          maxLength={maxLength + 50}
          autoComplete="off"
          disabled={isBusy}
          aria-invalid={errors[field] ? true : undefined}
          aria-describedby={describedBy(id, Boolean(hint), Boolean(errors[field]))}
          onChange={(e) => onFieldChange(field, e.target.value)}
          className={inputClass}
        />
      </FieldShell>
    );
  }

  function areaField(
    field: "purpose" | "extraDetails",
    label: string,
    placeholder: string,
    maxLength: number,
    rows: number,
    hint?: string,
  ) {
    const id = `field-${field}`;
    const length = values[field].length;
    return (
      <FieldShell
        id={id}
        label={label}
        hint={hint}
        error={errors[field]}
        counter={
          <span
            className={`shrink-0 tabular-nums ${length > maxLength ? "text-alert" : "text-ink-soft"}`}
          >
            {length}/{maxLength}
          </span>
        }
      >
        <textarea
          id={id}
          name={field}
          rows={rows}
          value={values[field]}
          placeholder={placeholder}
          disabled={isBusy}
          aria-invalid={errors[field] ? true : undefined}
          aria-describedby={describedBy(id, Boolean(hint), Boolean(errors[field]))}
          onChange={(e) => onFieldChange(field, e.target.value)}
          className={`${inputClass} resize-y`}
        />
      </FieldShell>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <fieldset disabled={isBusy} className="min-w-0">
        <legend className="mb-2 text-sm font-semibold">Document type</legend>
        <div className="space-y-2">
          {DOCUMENT_TYPE_LIST.map((type) => (
            <label
              key={type.id}
              className="flex cursor-pointer gap-3 border border-rule border-l-4 bg-desk px-3 py-2.5 has-checked:border-ink has-checked:bg-paper has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-seal"
            >
              <input
                type="radio"
                name="documentType"
                value={type.id}
                checked={documentType === type.id}
                onChange={() => onTypeChange(type.id)}
                className="mt-1 accent-seal"
              />
              <span>
                <span className="block text-base font-semibold">{type.label}</span>
                <span className="block text-sm text-ink-soft">
                  {type.description}
                </span>
              </span>
            </label>
          ))}
        </div>
        {errors.documentType ? (
          <p role="alert" className="mt-1 text-sm text-alert">
            {errors.documentType}
          </p>
        ) : null}
      </fieldset>

      <div className="space-y-1 border-t border-rule pt-5">
        <h2 className="mb-3 text-sm font-semibold">Details</h2>
        <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {textField("partyOne", config.partyOneLabel, config.partyOnePlaceholder, LIMITS.party)}
          {textField("partyTwo", config.partyTwoLabel, config.partyTwoPlaceholder, LIMITS.party)}
        </div>
        {textField(
          "jurisdiction",
          "Jurisdiction",
          "e.g. State of New York, USA",
          LIMITS.jurisdiction,
          "Where should this document apply? Write \"Not sure\" if you don't know.",
        )}
        {areaField(
          "purpose",
          config.purposeLabel,
          config.purposePlaceholder,
          LIMITS.purpose,
          4,
          config.purposeHint,
        )}
        {areaField(
          "extraDetails",
          "Extra details (optional)",
          config.extraPlaceholder,
          LIMITS.extraDetails,
          4,
          "Dates, amounts, tone, special terms. Anything you leave out becomes a [PLACEHOLDER] in the draft.",
        )}
      </div>

      <button
        type="submit"
        disabled={isBusy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-seal px-5 py-3 text-base font-semibold text-paper hover:bg-seal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seal disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {isBusy ? (
          <>
            <LoadingSpinner className="h-4 w-4" /> Drafting…
          </>
        ) : (
          "Generate draft"
        )}
      </button>

      <LegalDisclaimer />
    </form>
  );
}
