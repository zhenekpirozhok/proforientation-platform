import { AdminQuizTranslationsPage } from '@/features/admin-quiz-translations/ui/AdminQuizTranslationsPage';

export default function Page({ params }: { params: { id: string } }) {
  const quizId = Number(params.id);
  return <AdminQuizTranslationsPage quizId={quizId} />;
}
