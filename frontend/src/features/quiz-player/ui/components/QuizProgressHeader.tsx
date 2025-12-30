"use client";

export function QuizProgressHeader({
  current,
  total,
}: {
  current: number;
  total?: number | null;
}) {
  const hasTotal = typeof total === "number" && total > 0;
  const percent = hasTotal ? Math.round((current / total) * 100) : undefined;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
        <div className="font-medium">
          {hasTotal ? `Question ${current} of ${total}` : `Question ${current}`}
        </div>
        {percent != null ? (
          <div className="font-semibold text-indigo-600 dark:text-indigo-400">
            {percent}%
          </div>
        ) : null}
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-[width] duration-300"
          style={{ width: `${percent ?? 0}%` }}
        />
      </div>
    </div>
  );
}
