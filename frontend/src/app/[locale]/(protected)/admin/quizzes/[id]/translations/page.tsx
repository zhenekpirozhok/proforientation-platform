import AdminQuizTranslationsHubClient from './AdminQuizTranslationsHubClient';

export default async function Page({ params }: { params: Promise<{ id?: string }> }) {
  const resolvedParams = await params;
  const idRaw = resolvedParams?.id;
  if (!idRaw) return <div />;

  const quizId = Number(idRaw);
  if (!Number.isFinite(quizId) || Number.isNaN(quizId)) return <div />;

  return <AdminQuizTranslationsHubClient quizId={quizId} />;
}
