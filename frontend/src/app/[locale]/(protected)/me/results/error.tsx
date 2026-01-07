'use client';

import type { ResultStatusType } from 'antd/es/result';
import { ErrorState } from '@/shared/ui/feedback/ErrorState';
import { ErrorActionsClient } from '@/shared/ui/feedback/ErrorActionsClient';
import { useRouter } from '@/shared/i18n/lib/navigation';

type ErrorWithStatus = Error & { status?: unknown };

function getStatusCode(error: Error): number | null {
  const s = (error as ErrorWithStatus).status;
  return typeof s === 'number' ? s : null;
}

function toStatus(error: Error): ResultStatusType {
  const s = getStatusCode(error);
  if (s === 404) return '404';
  if (s === 403 || s === 401) return '403';
  return '500';
}

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();

  const status = toStatus(error);
  const code = getStatusCode(error);

  const title =
    code === 401
      ? 'Sign in required'
      : code === 403
        ? 'Access denied'
        : 'Something went wrong';

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <ErrorState
        status={status}
        title={title}
        subtitle={
          <span className="text-slate-600 dark:text-slate-300">
            {error.message}
          </span>
        }
        extra={
          <ErrorActionsClient
            primary={{
              label: 'Retry',
              onClick: () => reset(),
              type: 'primary',
            }}
            secondary={{ label: 'Go home', onClick: () => router.push('/') }}
          />
        }
      />
    </div>
  );
}
