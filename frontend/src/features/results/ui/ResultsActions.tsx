'use client';

import { Button, Modal } from 'antd';
import { useState } from 'react';

export function ResultsActions({
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  isAuthenticated,
  loginHref = '/login',
  loginTitle = 'Войдите, чтобы сохранить результат',
  loginBody = 'Чтобы сохранить результат и вернуться к нему позже, нужно войти в аккаунт.',
  loginOkText = 'Войти',
  loginCancelText = 'Отмена',
}: {
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  isAuthenticated: boolean;
  loginHref?: string;
  loginTitle?: string;
  loginBody?: string;
  loginOkText?: string;
  loginCancelText?: string;
}) {
  const [open, setOpen] = useState(false);

  const goToLogin = () => {
    const next =
      typeof window !== 'undefined'
        ? window.location.pathname + window.location.search
        : '/';

    const hasQuery = loginHref.includes('?');
    const url = loginHref + (hasQuery ? '&' : '?') + 'next=' + encodeURIComponent(next);

    window.location.href = url;
  };

  const handlePrimaryClick = () => {
    if (isAuthenticated) {
      onPrimary();
      return;
    }
    setOpen(true);
  };

  return (
    <div className="cp-results-actions">
      <Button
        type="primary"
        size="large"
        className="rounded-2xl"
        onClick={handlePrimaryClick}
      >
        {primaryLabel}
      </Button>

      <Button size="large" className="rounded-2xl" onClick={onSecondary}>
        {secondaryLabel}
      </Button>

      <Modal
        open={open}
        title={loginTitle}
        onOk={() => {
          setOpen(false);
          goToLogin();
        }}
        okText={loginOkText}
        onCancel={() => setOpen(false)}
        cancelText={loginCancelText}
        centered
      >
        {loginBody}
      </Modal>
    </div>
  );
}
