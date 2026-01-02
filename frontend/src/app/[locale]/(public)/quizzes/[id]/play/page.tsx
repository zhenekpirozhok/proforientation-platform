import { QuizPlayer } from "@/features/quiz-player/ui/QuizPlayer";
import { notFound } from "next/navigation";

type Props = {
  params:
    | { locale: string; id: string }
    | Promise<{ locale: string; id: string }>;
};

export default async function QuizPlayPage(props: Props) {
  const params = await props.params;
  const quizId = Number(params.id);

  if (!Number.isFinite(quizId) || quizId <= 0) notFound();

  return <QuizPlayer quizId={quizId} />;
}
