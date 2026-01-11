'use client';

import { Card } from 'antd';

export function SectionCard({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card
      title={title}
      className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-950"
      styles={{
        header: { borderBottom: '1px solid transparent' },
        body: { padding: 16 },
      }}
    >
      {children}
    </Card>
  );
}
