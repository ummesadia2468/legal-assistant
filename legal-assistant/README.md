# Legal Drafting Assistant (MVP)

Next.js (App Router) + TypeScript + Tailwind. Drafts an NDA, service agreement
or formal business letter with Google Gemini, lets you edit it, and exports a PDF.

> Not legal advice. Drafts are general starting points and must be reviewed by a
> qualified attorney.

## Run it

```bash
npm install
cp .env.example .env.local     # then paste your key into .env.local
npm run dev                    # http://localhost:3000
```

Get a key at https://aistudio.google.com/apikey and set `GEMINI_API_KEY`.
Optionally set `GEMINI_MODEL` (default `gemini-3.1-flash-lite`).

Checks: `npm run lint` and `npm run build`.

## How it fits together

```
Browser form --POST /api/draft--> server validates --> Gemini --> clean text --> editable preview
Browser edited text --POST /api/export-pdf--> server validates --> PDF --> download
```

| Path | Purpose |
|---|---|
| `src/app/dashboard/page.tsx` | The dashboard page |
| `src/components/Workspace.tsx` | All screen state: form, draft text, loading, errors |
| `src/components/DocumentForm.tsx` | Type picker, inputs, validation messages |
| `src/components/DocumentPreview.tsx` | Editable draft and Export PDF button |
| `src/app/api/draft/route.ts` | Server route: rate limit, validate, call AI |
| `src/app/api/export-pdf/route.ts` | Server route: validate, build PDF |
| `src/lib/ai.ts` | The only file that talks to Gemini (server-only) |
| `src/lib/prompts.ts` | System rules and per-document prompts |
| `src/lib/schemas.ts` | Zod validation and size limits, shared by browser and server |
| `src/lib/documentTypes.ts` | Supported document types and their form labels |
| `src/lib/pdf.tsx` | PDF layout (title, margins, page numbers) |
| `src/lib/rateLimit.ts` | Simple in-memory limiter (see note inside) |

## Known limits

- Nothing is stored on the server. Refreshing the page loses the draft.
- PDF export supports Latin letters only (built-in Times font).
- The rate limiter is per-process memory; use a shared store (e.g. Upstash Redis) in production.
- To switch AI provider, only `src/lib/ai.ts` and the two env variables need to change.
