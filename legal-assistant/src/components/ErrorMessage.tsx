export default function ErrorMessage({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mb-3 border-l-4 border-alert bg-alert-bg px-3 py-2 text-sm text-ink"
    >
      <strong className="font-semibold text-alert">Something needs attention. </strong>
      {message}
    </p>
  );
}
