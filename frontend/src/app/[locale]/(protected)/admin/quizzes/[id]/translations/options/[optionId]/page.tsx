import { AdminEntityTranslationsPage } from "@/features/admin-quiz-translations/ui/AdminEntityTranslationsPage";
import { OPTION_TRANSLATIONS_CONFIG } from "@/features/admin-quiz-translations/model/entityConfigs";

export default function Page({ params }: { params: { id: string; optionId: string } }) {
  const quizId = Number(params.id);
  const optionId = Number(params.optionId);

  return (
    <AdminEntityTranslationsPage
      entityId={optionId}
      config={OPTION_TRANSLATIONS_CONFIG}
      backHref={`/admin/quizzes/${quizId}/translations`}
      titleKey="pageTitleOption"
    />
  );
}
