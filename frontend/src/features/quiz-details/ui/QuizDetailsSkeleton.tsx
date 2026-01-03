'use client';

function Block({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800/70 ${className}`}
    />
  );
}

export function QuizDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800/70">
        <div className="px-5 py-8 sm:px-8 sm:py-10">
          <div className="flex gap-2">
            <Block className="h-6 w-28" />
            <Block className="h-6 w-24" />
          </div>
          <Block className="mt-5 h-10 w-2/3" />
          <Block className="mt-4 h-4 w-full" />
          <Block className="mt-2 h-4 w-5/6" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Block className="h-36 w-full" />
        <Block className="h-36 w-full" />
        <Block className="h-36 w-full" />
      </div>

      <Block className="h-40 w-full" />
      <Block className="h-12 w-44" />
    </div>
  );
}
