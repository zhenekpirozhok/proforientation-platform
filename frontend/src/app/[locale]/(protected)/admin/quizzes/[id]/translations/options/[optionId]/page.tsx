import OptionTranslationsClient from './OptionTranslationsClient';

export default function Page({ params }: { params: { id: string; optionId: string } }) {
  const quizId = Number(params.id);
  const optionId = Number(params.optionId);
  return <OptionTranslationsClient quizId={quizId} optionId={optionId} />;
}
