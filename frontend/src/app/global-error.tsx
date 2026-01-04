'use client';

import { ErrorState } from '@/shared/ui/feedback/ErrorState';
import { ErrorActionsClient } from '@/shared/ui/feedback/ErrorActionsClient';

export default function GlobalError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-[1200px] px-4">
          <ErrorState
            status="500"
            title="Something went wrong"
            subtitle={
              <span className="text-slate-600 dark:text-slate-300">
                An unexpected error occurred. Please try again.
              </span>
            }
            extra={
              <ErrorActionsClient
                primary={{
                  label: 'Retry',
                  onClick: () => reset(),
                  type: 'primary',
                }}
                secondary={{
                  label: 'Go home',
                  onClick: () => (window.location.href = '/'),
                }}
              />
            }
          />
        </div>
      </body>
    </html>
  );
}
