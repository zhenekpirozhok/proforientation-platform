'use client';

import { ErrorState } from '@/shared/ui/feedback/ErrorState';
import { ErrorActionsClient } from '@/shared/ui/feedback/ErrorActionsClient';

export function ForbiddenState() {
  return (
    <div className="mx-auto max-w-[1200px] px-4">
      <ErrorState
        status="403"
        title="Forbidden"
        subtitle={
          <span className="text-slate-600 dark:text-slate-300">
            You don’t have access to this page. Please sign in.
          </span>
        }
        extra={
          <ErrorActionsClient
            primary={{
              label: 'Sign in',
              onClick: () => (window.location.href = '/login'),
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
  );
}
