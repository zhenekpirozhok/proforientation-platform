'use client';

import { Card, Skeleton } from 'antd';

export default function Loading() {
  return (
    <div className="pb-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="h-9 w-[320px] rounded-xl bg-slate-200/70 dark:bg-slate-800/60 md:h-12 md:w-[520px]" />
          <div className="mt-3 h-5 w-[280px] rounded-lg bg-slate-200/60 dark:bg-slate-800/50 md:w-[620px]" />
        </div>

        <Card className="w-full rounded-2xl md:w-[220px]">
          <div className="h-8 w-16 rounded-lg bg-slate-200/70 dark:bg-slate-800/60" />
          <div className="mt-2 h-4 w-40 rounded-lg bg-slate-200/60 dark:bg-slate-800/50" />
        </Card>
      </div>

      <Card className="mt-6 rounded-2xl">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="h-12 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50" />
          <div className="h-12 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50" />
          <div className="h-12 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50" />
        </div>

        <div className="mt-3 flex justify-end">
          <div className="h-4 w-28 rounded bg-slate-200/50 dark:bg-slate-800/40" />
        </div>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="rounded-2xl">
            <Skeleton active paragraph={{ rows: 4 }} />
            <div className="mt-4">
              <Skeleton.Button active block />
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <div className="h-10 w-[260px] rounded-2xl bg-slate-200/60 dark:bg-slate-800/50" />
      </div>
    </div>
  );
}
