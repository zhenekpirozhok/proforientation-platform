"use client";

import { Card, Typography } from "antd";
import { RightOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

type MatchRow = {
  id: number;
  title: string;
  description?: string;
  score01: number; // 0..1
};

function pct(score01: number) {
  if (!Number.isFinite(score01)) return 0;
  return Math.max(0, Math.min(100, Math.round(score01 * 100)));
}

export function CareerMatches({
  title,
  subtitle,
  rows,
  matchLabel
}: {
  title: string;
  subtitle: string;
  rows: MatchRow[];
  matchLabel: string;
}) {
  return (
    <section className="cp-results-section">
      <div className="cp-results-section__header pb-5">
        <Title level={2} className="cp-results-section__title">
          {title}
        </Title>
        <Text className="cp-results-section__subtitle">{subtitle}</Text>
      </div>

      <div className="cp-matches">
        {rows.map((r) => {
          const p = pct(r.score01);
          return (
            <Card key={r.id} className="cp-match" bordered={false}>
              <div className="cp-match__left">
                <Title level={4} className="cp-match__title">
                  {r.title}
                </Title>
                {r.description ? (
                  <Paragraph className="cp-match__desc">
                    {r.description}
                  </Paragraph>
                ) : null}
              </div>

              <div className="cp-match__right">
                <div className="cp-match__pct">{p}%</div>
                <Text className="cp-match__pctLabel">{matchLabel}</Text>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
