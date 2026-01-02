"use client";

import { Card, Skeleton } from "antd";

export function ResultsSkeleton() {
  return (
    <div className="cp-results">
      <div className="cp-results-hero cp-results-hero--skeleton">
        <div className="cp-results-hero__inner">
          <Skeleton active title paragraph={{ rows: 2 }} />
          <Card className="cp-results-hero__card" variant="borderless">
            <Skeleton active title paragraph={{ rows: 2 }} />
          </Card>
        </div>
      </div>

      <div className="cp-results-content">
        <Card className="cp-results-card" variant="borderless">
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>

        <div style={{ height: 16 }} />

        <Card className="cp-results-card" variant="borderless">
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    </div>
  );
}
