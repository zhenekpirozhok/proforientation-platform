"use client";

import { ClockCircleOutlined } from "@ant-design/icons";

export function QuizDetailsHero({
  title,
  description,
  categoryName,
  minutes,
}: {
  title: string;
  description?: string | null;
  categoryName?: string;
  minutes?: number | null;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white dark:border-slate-800/70 dark:bg-slate-950">
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 px-5 py-8 text-white sm:px-8 sm:py-10">
        <div className="flex flex-wrap items-center gap-2">
          {categoryName ? (
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              {categoryName}
            </span>
          ) : null}

          {minutes != null ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/90 px-3 py-1 text-xs font-semibold text-slate-900">
              <ClockCircleOutlined />
              {minutes} min
            </span>
          ) : null}
        </div>

        <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">
          {title}
        </h1>

        {description ? (
          <p className="mt-4 max-w-[740px] text-sm text-white/90 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
