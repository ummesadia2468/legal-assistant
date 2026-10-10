export default function LegalDisclaimer() {
  return (
    <div className="space-y-2 border-t border-rule pt-4 text-sm leading-relaxed text-ink-soft">
      <p>
        <strong className="font-semibold text-ink">Not legal advice.</strong>{" "}
        This tool writes general first drafts. Have a qualified attorney review
        any document before you sign or send it, and check that it fits the
        laws where you are.
      </p>
      <p>
        <strong className="font-semibold text-ink">Your privacy.</strong> What
        you enter is sent to an AI provider to write the draft. Don&apos;t
        include ID numbers, bank details or other highly sensitive data.
      </p>
    </div>
  );
}
