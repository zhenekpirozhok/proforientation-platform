'use client';

import type React from 'react';
import Link from 'next/link';
import { Button, Card } from 'antd';
import {
  ClockCircleOutlined,
  QuestionCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import type {
  QuizDto,
  ProfessionCategoryDto,
} from '@/shared/api/generated/model';

type QuizMetric = {
  attemptsTotal?: number;
  questionsTotal?: number;
  estimatedDurationSeconds?: number;
  avgDurationSeconds?: number;
};

function clampInt(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatTaken(n: number) {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n < 1_000) return String(n);
  if (n < 1_000_000) {
    const v = n / 1_000;
    return `${v.toFixed(n % 1_000 === 0 ? 0 : 1)}k`;
  }
  const v = n / 1_000_000;
  return `${v.toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
}

function minutesFromSeconds(sec?: number | null) {
  if (sec == null || !Number.isFinite(sec) || sec <= 0) return null;
  const min = Math.round(sec / 60);
  return clampInt(min, 1, 180);
}

function categoryStyles(color?: string) {
  if (!color) {
    return {
      className:
        'bg-slate-100 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200',
      style: undefined as React.CSSProperties | undefined,
    };
  }

  return {
    className: '',
    style: { backgroundColor: `${color}22`, color } as React.CSSProperties,
  };
}

function getDescriptionDefault(quiz: QuizDto): string {
  if (typeof quiz !== 'object' || quiz === null) return '';
  const v = quiz as Record<string, unknown>;
  const d = v['descriptionDefault'];
  return typeof d === 'string' ? d : '';
}

function pickDurationSeconds(metric?: QuizMetric) {
  return typeof metric?.estimatedDurationSeconds === 'number'
    ? metric.estimatedDurationSeconds
    : null;
}

export function QuizCard({
  locale,
  quiz,
  metric,
  category,
}: {
  locale: string;
  quiz: QuizDto & { id: number };
  metric?: QuizMetric;
  category?: ProfessionCategoryDto;
}) {
  const t = useTranslations('Quizzes');

  const href = `/${locale}/quizzes/${quiz.id}`;
  const title = quiz.title ?? t('fallbackTitle', { id: quiz.id });
  const description = getDescriptionDefault(quiz);

  const taken =
    typeof metric?.attemptsTotal === 'number' ? metric.attemptsTotal : 0;

  const questionsTotal =
    typeof metric?.questionsTotal === 'number' ? metric.questionsTotal : null;

  const durationMin = minutesFromSeconds(pickDurationSeconds(metric)) ?? 15;

  const catLabel = category?.name ?? t('category');
  const catColor = category?.colorCode;
  const cat = categoryStyles(catColor);

  return (
    <Link
      href={href}
      className="block h-full"
      data-testid="quiz-card"
      data-quiz-id={quiz.id}
    >
      <Card
        className="h-full rounded-2xl border border-slate-200/70 bg-white transition active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5 dark:border-slate-800/70 dark:bg-slate-950 dark:hover:shadow-black/30"
        styles={{ body: { padding: 18, height: '100%' } }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3">
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ring-slate-900/5 dark:ring-white/10 ${cat.className}`}
              style={cat.style}
            >
              {catLabel}
            </span>

            <div className="min-h-[18px] flex flex-nowrap items-center gap-3 overflow-hidden text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
                <ClockCircleOutlined />
                <span>{durationMin}</span>
                <span className="hidden sm:inline">{t('min')}</span>
              </span>

              <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
                <UserOutlined />
                <span>{formatTaken(taken)}</span>
                <span className="hidden sm:inline">{t('takenShort')}</span>
              </span>

              {questionsTotal != null ? (
                <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
                  <QuestionCircleOutlined />
                  <span>{questionsTotal}</span>
                  <span className="hidden sm:inline">{t('questions')}</span>
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-3 line-clamp-2 text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
            {title}
          </div>

          <div className="mt-1 line-clamp-3 text-sm leading-5 text-slate-600 dark:text-slate-300">
            {description || '\u00A0'}
          </div>

          <div className="flex-1" />

          <div className="pt-5">
            <Button type="primary" size="large" className="w-full rounded-2xl">
              {t('start')}
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
