import { QuizAnalyticsScreen } from '@/features/admin-analytics/ui/QuizAnalyticsScreen';
import { t } from '@/features/admin-analytics/i18n';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; quizId: string }>;
  searchParams: Promise<{ quizVersionId?: string }>;
}) {
  const { locale, quizId } = await params;
  const { quizVersionId } = await searchParams;

  const tr = t(locale);

  if (!quizVersionId) {
    return <div className="p-6">{tr.quizVersionRequired}</div>;
  }

  return (
    <QuizAnalyticsScreen
      locale={locale}
      quizId={quizId}
      quizVersionId={quizVersionId}
    />
  );
}
