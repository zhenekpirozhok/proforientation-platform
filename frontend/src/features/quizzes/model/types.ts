import { ProfessionCategoryDto, QuizDto } from '@/shared/api/generated/model';

export type FiltersValue = {
  search: string;
  category: string;
  duration: string;
};

export type QuizCatalogItem = (QuizDto & { id: number }) & {
  metric?: QuizMetric;
  category?: ProfessionCategoryDto;
};

export type PageLike<T> = {
  content?: T[];
  items?: T[];
  totalElements?: number;
  total?: number;
};

export type QuizMetric = {
  quizId?: number;
  categoryId?: number;
  attemptsTotal?: number;
  questionsTotal?: number;
  estimatedDurationSeconds?: number;
  avgDurationSeconds?: number;
};

export type SearchQuizzesParams = {
  search: string;
  page?: number;
  size?: number;
  sortBy?: string;
};
