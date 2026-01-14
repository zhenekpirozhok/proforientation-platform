'use client';

import { Button, Pagination } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export function QuizzesPagination({
  page,
  pageSize,
  total,
  onChange,
  loading,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  loading?: boolean;
}) {
  const t = useTranslations('Quizzes');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const set = () => setIsMobile(mq.matches);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canMore = page < totalPages;

  if (isMobile) {
    return (
      <div className="mt-6 flex justify-center">
        <Button
          type="primary"
          size="large"
          className="rounded-2xl"
          disabled={!canMore}
          loading={loading}
          onClick={() => onChange(page + 1, pageSize)}
        >
          {canMore ? t('loadMore') : t('noMore')}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6 flex justify-center">
      <Pagination
        current={page}
        pageSize={pageSize}
        total={total}
        onChange={onChange}
        showSizeChanger={false}
      />
    </div>
  );
}
