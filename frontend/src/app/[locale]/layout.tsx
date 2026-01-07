import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/shared/i18n/lib/routing';
import { LocaleHtmlLangSync } from '@/shared/providers/LocaleHtmlLangSync';
import { AppShell } from '@/shared/ui/layout/app-shell/AppShell';
import { SessionGate } from '@/features/session/ui/SessionGate';

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
      <SessionGate />
      <LocaleHtmlLangSync locale={locale} />
      <AppShell>{children}</AppShell>
    </NextIntlClientProvider>
  );
}
