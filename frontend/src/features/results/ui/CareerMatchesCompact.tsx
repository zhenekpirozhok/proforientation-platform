'use client';

import { useMemo, useState } from 'react';
import { Button } from 'antd';

type MatchRow = {
  id: number;
  title: string;
  description?: string;
  score01: number;
};

function pct(score01: number) {
  if (!Number.isFinite(score01)) return 0;
  return Math.max(0, Math.min(100, Math.round(score01 * 100)));
}

export function CareerMatchesCompact({
  title,
  subtitle,
  rows,
  matchLabel,
  collapsedCount = 3,
  expandedCount = 5,
  showMoreLabel,
  showLessLabel,
}: {
  title: string;
  subtitle?: string;
  rows: MatchRow[];
  matchLabel: string;
  collapsedCount?: number;
  expandedCount?: number;
  showMoreLabel: string;
  showLessLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const visible = useMemo(() => {
    const n = expanded ? expandedCount : collapsedCount;
    return rows.slice(0, Math.max(0, n));
  }, [rows, expanded, collapsedCount, expandedCount]);

  const canToggle = rows.length > collapsedCount;

  return (
    <section>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {title}
          </div>
          {subtitle ? (
            <div className="text-xs text-slate-600 dark:text-slate-300">
              {subtitle}
            </div>
          ) : null}
        </div>

        {canToggle ? (
          <Button
            type="link"
            className="px-0 text-sm"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? showLessLabel : showMoreLabel}
          </Button>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {visible.length === 0 ? (
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {/* empty handled by caller if нужно */}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((r) => {
              const p = pct(r.score01);

              return (
                <div
                  key={r.id}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {r.title}
                      </div>

                      {r.description ? (
                        <div className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                          {r.description}
                        </div>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {p}%
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        {matchLabel}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
