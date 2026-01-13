'use client';

import { useTranslations } from 'next-intl';

export default function PrivacyPage() {
    const t = useTranslations('Privacy');

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
        <p className="text-slate-700 dark:text-slate-300">
          {t('description')}
        </p>
      </section>

      {/* Render sections */}
      {[
        'controller',
        'dataCollected',
        'purpose',
        'legalBasis',
        'ai',
        'security',
        'retention',
        'cookies',
        'rights',
        'thirdParties',
        'changes',
        'contact',
      ].map((key) => (
        <PrivacySection key={key} sectionKey={key} />
      ))}
    </div>
  );
}
function PrivacySection({ sectionKey }: { sectionKey: string }) {
  const t = useTranslations(`Privacy.sections.${sectionKey}`);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{t('title')}</h2>

      {t.has('text') ? (
        <p className="text-slate-700 dark:text-slate-300">{t('text')}</p>
      ) : null}

      {t.has('intro') ? (
        <p className="text-slate-700 dark:text-slate-300">{t('intro')}</p>
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

      {t.has('contact') ? (
        <p className="text-slate-700 dark:text-slate-300">{t('contact')}</p>
      ) : null}

      {t.has('email') ? (
        <p className="text-slate-700 dark:text-slate-300">{t('email')}</p>
      ) : null}
    </section>
  );
}
