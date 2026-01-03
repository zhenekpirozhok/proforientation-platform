import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/shared/i18n/lib/routing';
import { LocaleHtmlLangSync } from '@/shared/providers/LocaleHtmlLangSync';
import { SessionGate } from './SessionGate';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleHtmlLangSync locale={locale} />
      <SessionGate />
      {children}
    </NextIntlClientProvider>
  );
}
