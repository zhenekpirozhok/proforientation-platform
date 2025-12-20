'use client';

import {useLocale, useTranslations} from 'next-intl';
import {Link, usePathname} from '@/shared/i18n/lib/navigation';

export function LocaleSwitcher() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav style={{display: 'flex', gap: 12, padding: 12}}>
      <span>{t('language')}:</span>

      <Link href={pathname} locale="ru" aria-current={locale === 'ru' ? 'page' : undefined}>
        {t('russian')}
      </Link>

      <Link href={pathname} locale="en" aria-current={locale === 'en' ? 'page' : undefined}>
        {t('english')}
      </Link>
    </nav>
  );
}
