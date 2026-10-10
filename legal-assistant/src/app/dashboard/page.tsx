import Workspace from "@/components/Workspace";

export default function DashboardPage() {
  return (
    <>
      <header className="border-b border-rule bg-paper">
        <div className="mx-auto flex max-w-7xl flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-4 sm:px-6">
          <h1 className="font-doc text-xl font-bold tracking-tight">
            Legal Drafting Assistant
          </h1>
          <p className="text-sm text-ink-soft">
            General drafts to start from. Not legal advice.
          </p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Workspace />
      </main>
    </>
  );
}
