"use client";

import { Card, Skeleton } from "antd";

export function QuizGridSkeleton() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="rounded-2xl">
          <Skeleton active paragraph={{ rows: 4 }} />
          <div className="mt-4">
            <Skeleton.Button active block />
          </div>
        </Card>
      ))}
    </div>
  );
}
