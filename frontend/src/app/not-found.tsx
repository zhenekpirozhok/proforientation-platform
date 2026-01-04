// src/app/not-found.tsx
import NextLink from 'next/link';
import { headers } from 'next/headers';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ErrorState } from '@/shared/ui/feedback/ErrorState';
import { routing, type AppLocale } from '@/shared/i18n/lib/routing';

function normalizeLocale(value: string | null): AppLocale {
  return value === 'ru' || value === 'en' ? value : routing.defaultLocale;
}

export default async function RootNotFound() {
  const locale = normalizeLocale((await headers()).get('x-next-intl-locale'));

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'NotFound' });

  return (
    <ErrorState
      status="404"
      title={t('title')}
      subtitle={
        <span className="text-slate-600 dark:text-slate-300">
          {t('subtitle')}
        </span>
      }
      extra={
        <div className="flex flex-wrap justify-center gap-3">
          <NextLink
            href={`/${locale}`}
            className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-2.5 text-white"
          >
            {t('toHome')}
          </NextLink>

          <NextLink
            href={`/${locale}/quizzes`}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          >
            {t('toQuizzes')}
          </NextLink>
        </div>
      }
    />
  );
}
