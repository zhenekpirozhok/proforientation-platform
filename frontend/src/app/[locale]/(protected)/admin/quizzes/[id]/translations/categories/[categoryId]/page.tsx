import CategoryTranslationsClient from './CategoryTranslationsClient';

export default async function Page({ params }: { params: Promise<{ id: string; categoryId: string }> }) {
  const { id, categoryId: categoryIdStr } = await params;
  const quizId = Number(id);
  const categoryId = Number(categoryIdStr);

  if (!Number.isFinite(quizId) || quizId <= 0) return <div />;
  if (!Number.isFinite(categoryId) || categoryId <= 0) return <div />;

  return <CategoryTranslationsClient quizId={quizId} categoryId={categoryId} />;
}
