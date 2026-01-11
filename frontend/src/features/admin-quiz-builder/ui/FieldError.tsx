'use client';

import { Typography } from 'antd';
import { useTranslations } from 'next-intl';

export function FieldError({
  code,
}: {
  code?: string;
}) {
  const t = useTranslations('AdminQuizBuilder.validation');
  if (!code) return null;

  return (
    <Typography.Text type="danger" className="block text-xs">
      {t(code)}
    </Typography.Text>
  );
}
