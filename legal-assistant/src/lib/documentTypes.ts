// One place that defines every supported document type.
// The form, the validation and (in Stage B) the AI prompt all read from here,
// so adding a new document type later means editing this file first.

export const DOCUMENT_TYPE_IDS = [
  "nda",
  "service-agreement",
  "business-letter",
] as const;

export type DocumentTypeId = (typeof DOCUMENT_TYPE_IDS)[number];

export interface DocumentTypeConfig {
  id: DocumentTypeId;
  /** Name shown to the user and used as the PDF title. */
  label: string;
  /** One-line explanation shown in the type picker. */
  description: string;
  partyOneLabel: string;
  partyOnePlaceholder: string;
  partyTwoLabel: string;
  partyTwoPlaceholder: string;
  purposeLabel: string;
  purposeHint: string;
  purposePlaceholder: string;
  extraPlaceholder: string;
}

export const DOCUMENT_TYPES: Record<DocumentTypeId, DocumentTypeConfig> = {
  nda: {
    id: "nda",
    label: "Non-Disclosure Agreement",
    description: "Keep shared business information confidential.",
    partyOneLabel: "Disclosing party",
    partyOnePlaceholder: "e.g. Northwind Studio Ltd.",
    partyTwoLabel: "Receiving party",
    partyTwoPlaceholder: "e.g. Jordan Lee",
    purposeLabel: "What information will be shared, and why?",
    purposeHint: "Describe the reason for sharing, in plain language.",
    purposePlaceholder:
      "e.g. Sharing product designs and pricing so the receiving party can evaluate a possible partnership.",
    extraPlaceholder:
      "e.g. Agreement should last 2 years. Allow sharing with legal advisors.",
  },
  "service-agreement": {
    id: "service-agreement",
    label: "Service Agreement",
    description: "Set out work, payment and responsibilities.",
    partyOneLabel: "Service provider",
    partyOnePlaceholder: "e.g. Alex Rivera Design",
    partyTwoLabel: "Client",
    partyTwoPlaceholder: "e.g. Harbor Coffee Co.",
    purposeLabel: "What services will be provided?",
    purposeHint: "List the work, deliverables and timeline you know about.",
    purposePlaceholder:
      "e.g. Design and build a five-page website, delivered within 8 weeks.",
    extraPlaceholder:
      "e.g. Fee of 4,000 paid in two instalments. Two rounds of revisions included.",
  },
  "business-letter": {
    id: "business-letter",
    label: "Formal Business Letter",
    description: "A professional letter for a specific purpose.",
    partyOneLabel: "Sender",
    partyOnePlaceholder: "e.g. Priya Shah, Operations Manager, Orbit Supplies",
    partyTwoLabel: "Recipient",
    partyTwoPlaceholder: "e.g. Accounts Department, Meridian Logistics",
    purposeLabel: "What is the letter about?",
    purposeHint: "State the main message or request.",
    purposePlaceholder:
      "e.g. Request payment of an overdue invoice and propose a payment date.",
    extraPlaceholder:
      "e.g. Invoice #1042 dated 3 March. Keep the tone firm but polite.",
  },
};

export const DOCUMENT_TYPE_LIST: DocumentTypeConfig[] = DOCUMENT_TYPE_IDS.map(
  (id) => DOCUMENT_TYPES[id],
);
