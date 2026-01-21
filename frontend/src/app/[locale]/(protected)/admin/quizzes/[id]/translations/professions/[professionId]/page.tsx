import ProfessionTranslationsClient from './ProfessionTranslationsClient';

export default async function Page({ params }: { params: Promise<{ id: string; professionId: string }> }) {
  const { id, professionId: professionIdStr } = await params;
  const quizId = Number(id);
  const professionId = Number(professionIdStr);

  if (!Number.isFinite(quizId) || quizId <= 0) return <div />;
  if (!Number.isFinite(professionId) || professionId <= 0) return <div />;

  return (
    <ProfessionTranslationsClient
      quizId={quizId}
      professionId={professionId}
    />
  );
}
