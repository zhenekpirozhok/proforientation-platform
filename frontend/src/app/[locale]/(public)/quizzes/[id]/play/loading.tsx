export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-10 w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
