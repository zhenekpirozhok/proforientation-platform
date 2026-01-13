'use client';

import { useTranslations } from 'next-intl';

export default function TermsPage() {
    const t = useTranslations('Terms');

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <header>
        <h1 className="mb-2 text-2xl font-semibold">
          {t('title')}
        </h1>
        <p className="text-sm text-slate-500">
          {t('lastUpdated')}
        </p>
      </header>

      <section className="space-y-3">
        <p className="text-slate-700 dark:text-slate-300">
          {t('intro')}
        </p>
      </section>

      {[
        'purpose',
        'accounts',
        'acceptableUse',
        'ip',
        'aiDisclaimer',
        'availability',
        'liability',
        'termination',
        'law',
        'contact',
      ].map((key) => (
        <TermsSection key={key} sectionKey={key} />
      ))}
    </div>
  );
}

function TermsSection({ sectionKey }: { sectionKey: string }) {
  const t = useTranslations(`Terms.sections.${sectionKey}`);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{t('title')}</h2>

      {t.has('text') ? (
        <p className="text-slate-700 dark:text-slate-300">{t('text')}</p>
      ) : null}

      {t.has('items') ? (
        <ul className="list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
          {(t.raw('items') as string[]).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : null}

      {t.has('note') ? (
        <p className="text-sm text-slate-500">{t('note')}</p>
      ) : null}

      {t.has('email') ? (
        <p className="text-slate-700 dark:text-slate-300">{t('email')}</p>
      ) : null}
    </section>
  );
}
