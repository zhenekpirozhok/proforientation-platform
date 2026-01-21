import { AdminEntityTranslationsPage } from "@/features/admin-quiz-translations/ui/AdminEntityTranslationsPage";
import { QUESTION_TRANSLATIONS_CONFIG } from "@/features/admin-quiz-translations/model/entityConfigs";

export default function Page({ params }: { params: { id: string; questionId: string } }) {
  const quizId = Number(params.id);
  const questionId = Number(params.questionId);

  return (
    <AdminEntityTranslationsPage
      entityId={questionId}
      config={QUESTION_TRANSLATIONS_CONFIG}
      backHref={`/admin/quizzes/${quizId}/translations`}
      titleKey="pageTitleQuestion"
    />
  );
}
