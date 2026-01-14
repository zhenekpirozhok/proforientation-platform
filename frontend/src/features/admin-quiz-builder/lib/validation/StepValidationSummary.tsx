'use client';

import { Alert } from 'antd';
import { useMemo } from 'react';

export function StepValidationSummary(props: {
  title: string;
  items: Array<{ field: string; label: string }>;
}) {
  const { title, items } = props;

  const description = useMemo(() => {
    if (items.length === 0) return null;

    return (
      <ul className="m-0 list-disc pl-6">
        {items.map((it) => (
          <li key={it.field}>
            <button
              type="button"
              className="cursor-pointer bg-transparent p-0 text-left text-inherit underline underline-offset-2"
              onClick={() => {
                const el =
                  document.querySelector(`[data-field="${it.field}"]`) ||
                  document.getElementById(it.field);

                if (!el) return;

                el.scrollIntoView({ behavior: 'smooth', block: 'center' });

                const focusable = (el as HTMLElement).querySelector?.(
                  'input,textarea,select,[tabindex]:not([tabindex="-1"])',
                ) as HTMLElement | null;

                (focusable ?? (el as HTMLElement)).focus?.();
              }}
            >
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    );
  }, [items]);

  if (items.length === 0) return null;

  return (
    <Alert type="error" showIcon message={title} description={description} />
  );
}
