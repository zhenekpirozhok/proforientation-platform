"use client";

function Block({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800/70 ${className}`}
    />
  );
}

export function QuizPlayerSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[820px]">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <Block className="h-4 w-40" />
          <Block className="h-4 w-12" />
        </div>
        <Block className="mt-3 h-2 w-full rounded-full" />
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-6 dark:border-slate-800/70 dark:bg-slate-950 sm:p-8">
        <Block className="h-8 w-3/4" />
        <Block className="mt-4 h-4 w-full" />
        <Block className="mt-2 h-4 w-5/6" />

        <div className="mt-6 space-y-3">
          <Block className="h-16 w-full" />
          <Block className="h-16 w-full" />
          <Block className="h-16 w-full" />
          <Block className="h-16 w-full" />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Block className="h-12 w-full sm:w-40" />
        <Block className="h-12 w-full sm:w-52" />
      </div>
    </div>
  );
}
