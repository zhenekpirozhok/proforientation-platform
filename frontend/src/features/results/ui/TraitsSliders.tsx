'use client';

import { Card, Progress, Typography } from 'antd';

const { Title, Text } = Typography;

type TraitRow = {
  key: string;
  label: string;
  description?: string;
  value: number;
};

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

function normalizeTo100(v: number) {
  if (!Number.isFinite(v)) return 0;
  if (v <= 1) return clamp(Math.round(v * 100), 0, 100);
  if (v <= 10) return clamp(Math.round((v / 10) * 100), 0, 100);
  if (v <= 100) return clamp(Math.round(v), 0, 100);
  return clamp(Math.round(v), 0, 100);
}

export function TraitsSliders({
  title,
  rows,
}: {
  title: string;
  rows: TraitRow[];
}) {
  return (
    <section className="cp-results-section">
      <Title level={2} className="cp-results-section__title">
        {title}
      </Title>

      <Card className="cp-results-card" variant="borderless">
        <div className="cp-traitsGrid">
          {rows.map((r) => {
            const v = normalizeTo100(r.value);
            return (
              <div key={r.key} className="cp-traitCard">
                <div className="cp-traitCard__top">
                  <div className="cp-traitCard__text">
                    <Text strong>{r.label}</Text>
                    {r.description ? (
                      <Text className="cp-traitCard__desc">
                        {r.description}
                      </Text>
                    ) : null}
                  </div>
                  <Text className="cp-traitCard__value">{v}%</Text>
                </div>

                <Progress percent={v} showInfo={false} />
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
