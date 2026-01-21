import QuestionTranslationsClient from './QuestionTranslationsClient';

export default function Page({ params }: { params: { id: string; questionId: string } }) {
  const quizId = Number(params.id);
  const questionId = Number(params.questionId);
  return <QuestionTranslationsClient quizId={quizId} questionId={questionId} />;
}
