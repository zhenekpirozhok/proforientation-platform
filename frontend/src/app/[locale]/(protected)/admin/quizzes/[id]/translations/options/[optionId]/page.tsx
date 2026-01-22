import OptionTranslationsClient from './OptionTranslationsClient';

export default async function Page({
  params,
}: {
  params: Promise<{ id?: string; optionId?: string }>;
}) {
  const resolved = await params;
  const quizId = Number(resolved?.id);
  const optionId = Number(resolved?.optionId);

  if (!Number.isFinite(quizId) || quizId <= 0) return <div />;
  if (!Number.isFinite(optionId) || optionId <= 0) return <div />;

  return <OptionTranslationsClient quizId={quizId} optionId={optionId} />;
}
