import TraitTranslationsClient from './TraitTranslationsClient';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; traitId: string }>;
}) {
  const { id, traitId: traitIdStr } = await params;
  const quizId = Number(id);
  const traitId = Number(traitIdStr);

  if (!Number.isFinite(quizId) || quizId <= 0) return <div />;
  if (!Number.isFinite(traitId) || traitId <= 0) return <div />;

  return <TraitTranslationsClient quizId={quizId} traitId={traitId} />;
}
