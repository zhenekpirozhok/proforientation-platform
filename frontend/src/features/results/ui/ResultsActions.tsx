'use client';

import { Button } from 'antd';

export function ResultsActions({
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: {
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <div className="cp-results-actions">
      <Button
        type="primary"
        size="large"
        className="rounded-2xl"
        onClick={onPrimary}
      >
        {primaryLabel}
      </Button>
      <Button size="large" className="rounded-2xl" onClick={onSecondary}>
        {secondaryLabel}
      </Button>
    </div>
  );
}
