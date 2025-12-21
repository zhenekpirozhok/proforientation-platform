import { QuizPlayer } from "@/features/quiz-player/ui/QuizPlayer";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function QuizPlayPage(props: Props) {
  const { id } = await props.params;
  const quizId = Number(id);

  if (!Number.isFinite(quizId)) return <p>Некорректный id теста</p>;

  return <QuizPlayer quizId={quizId} />;
}
