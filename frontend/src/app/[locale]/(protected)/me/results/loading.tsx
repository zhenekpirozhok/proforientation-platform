'use client';

import { Card, Skeleton } from 'antd';

export default function ResultsSkeleton() {
  return (
    <div className="space-y-5">
      {/* Top professions summary */}
      <Card className="dark:!bg-slate-950 dark:!border-slate-800">
        <div className="space-y-3">
          <Skeleton.Input active size="small" style={{ width: 140 }} />
          <div className="flex flex-wrap gap-2">
            <Skeleton.Button active size="small" />
            <Skeleton.Button active size="small" />
            <Skeleton.Button active size="small" />
          </div>
        </div>
      </Card>

      {/* Recommended professions */}
      <Card className="dark:!bg-slate-950 dark:!border-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton.Input active size="small" style={{ width: 190 }} />
            <Skeleton.Input active size="small" style={{ width: 260 }} />
          </div>
          <Skeleton.Button active size="small" />
        </div>

        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton.Input
                    active
                    size="small"
                    style={{ width: '55%' }}
                  />
                  <Skeleton.Input
                    active
                    size="small"
                    style={{ width: '85%' }}
                  />
                </div>

                <div className="shrink-0 space-y-2 text-right">
                  <Skeleton.Input active size="small" style={{ width: 56 }} />
                  <Skeleton.Input active size="small" style={{ width: 44 }} />
                </div>
              </div>

              <div className="mt-3">
                <Skeleton.Input active size="small" style={{ width: '100%' }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Traits */}
      <div>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton.Input active size="small" style={{ width: 150 }} />
            <Skeleton.Input active size="small" style={{ width: 280 }} />
          </div>
          <Skeleton.Button active size="small" />
        </div>

        <Card className="dark:!bg-slate-950 dark:!border-slate-800">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton.Input
                      active
                      size="small"
                      style={{ width: '45%' }}
                    />
                    <Skeleton.Input
                      active
                      size="small"
                      style={{ width: '90%' }}
                    />
                  </div>
                  <Skeleton.Input active size="small" style={{ width: 44 }} />
                </div>

                <div className="mt-3">
                  <Skeleton.Input
                    active
                    size="small"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton.Button active size="large" style={{ width: 180 }} />
        <Skeleton.Button active size="large" style={{ width: 180 }} />
      </div>
    </div>
  );
}
