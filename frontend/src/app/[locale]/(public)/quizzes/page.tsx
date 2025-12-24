'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuizzes } from '@/entities/quiz/api/useQuizzes';
import type { QuizDto } from '@/shared/api/generated/model';

type PageLike<T> = {
  content?: T[];
  items?: T[];
};

function extractItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];

  const page = data as PageLike<T> | null | undefined;
  return page?.content ?? page?.items ?? [];
}

function hasNumberId(q: QuizDto): q is QuizDto & { id: number } {
  return typeof q.id === 'number' && Number.isFinite(q.id);
}

export default function QuizzesPage() {
  const t = useTranslations('Quizzes');
  const { locale } = useParams<{ locale: string }>();

  const { data, isLoading, error } = useQuizzes({ page: 1, size: 20 });

  if (isLoading) return <div>{t('loading')}</div>;
  if (error) return <div>{t('error')}</div>;

  const items = extractItems<QuizDto>(data).filter(hasNumberId);

  return (
    <div style={{ padding: 24 }}>
      <h1>{t('title')}</h1>

      <ul>
        {items.map((q) => (
          <li key={q.id}>
            <Link href={`/${locale}/quizzes/${q.id}`}>
              {q.title ?? t('fallbackTitle', { id: q.id })}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
