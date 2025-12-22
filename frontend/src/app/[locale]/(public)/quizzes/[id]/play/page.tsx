import { QuizPlayer } from "@/features/quiz-player/ui/QuizPlayer";

type Props = {
  params: { locale: string; id: string } | Promise<{ locale: string; id: string }>;
};

export default async function QuizPlayPage(props: Props) {
  const params = await props.params;
  const quizId = Number(params.id);

  if (!Number.isFinite(quizId)) return <p>Некорректный id теста</p>;

  return <QuizPlayer quizId={quizId} />;
}
