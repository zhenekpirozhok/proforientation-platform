'use client';

import { TrophyFilled } from '@ant-design/icons';
import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export function ResultsHero({
  title,
  subtitleTitle,
  subtitleText,
}: {
  title: string;
  subtitleTitle: string;
  subtitleText: string;
}) {
  return (
    <section className="cp-results-hero">
      <div className="cp-results-hero__inner">
        <div className="cp-results-hero__icon">
          <TrophyFilled />
        </div>

        <Title level={1} className="cp-results-hero__title">
          {title}
        </Title>

        <Card className="cp-results-hero__card" variant="borderless">
          <Title level={3} className="cp-results-hero__cardTitle">
            {subtitleTitle}
          </Title>
          <Paragraph className="cp-results-hero__cardText">
            {subtitleText}
          </Paragraph>
        </Card>
      </div>
    </section>
  );
}
