import QuestionTranslationsClient from './QuestionTranslationsClient';

export default async function Page({ params }: { params: Promise<{ id?: string; questionId?: string }> }) {
  const resolved = await params;
  const quizId = Number(resolved?.id);
  const questionId = Number(resolved?.questionId);

  if (!Number.isFinite(quizId) || quizId <= 0) return <div />;
  if (!Number.isFinite(questionId) || questionId <= 0) return <div />;

  return <QuestionTranslationsClient quizId={quizId} questionId={questionId} />;
}
