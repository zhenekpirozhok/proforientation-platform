'use client';

import { useEffect } from 'react';

type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
  clientId?: string;
};

type GooglePromptMomentNotification = {
  isDisplayed?: () => boolean;
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
  isDismissedMoment?: () => boolean;
  getNotDisplayedReason?: () => string;
  getSkippedReason?: () => string;
  getDismissedReason?: () => string;
};

type GoogleIdConfig = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  itp_support?: boolean;
  use_fedcm_for_prompt?: boolean;
};

type GoogleId = {
  initialize: (config: GoogleIdConfig) => void;
  prompt: (cb?: (moment: GooglePromptMomentNotification) => void) => void;
  cancel: () => void;
  disableAutoSelect?: () => void;
};

type GoogleAccounts = { id: GoogleId };

declare global {
  interface Window {
    google?: { accounts?: GoogleAccounts };
    __gsiScriptPromise?: Promise<void>;
    __gsiInitialized?: boolean;
    __gsiPrompting?: boolean;
    __gsiDisabled?: boolean;
  }
}

function loadGsi(): Promise<void> {
  if (window.__gsiScriptPromise) return window.__gsiScriptPromise;

  window.__gsiScriptPromise = new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('GSI load failed'));
    document.head.appendChild(s);
  });

  return window.__gsiScriptPromise;
}

export function GoogleOneTapInit({
  onCredential,
  disabled,
}: {
  onCredential: (token: string) => void;
  disabled?: boolean;
}) {
  useEffect(() => {
    if (disabled) return;
    if (window.__gsiDisabled) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    let cancelled = false;

    (async () => {
      await loadGsi();
      if (cancelled) return;

      const g = window.google?.accounts?.id;
      if (!g) return;

      if (!window.__gsiInitialized) {
        g.initialize({
          client_id: clientId,
          callback: (r) => {
            const token = typeof r.credential === 'string' ? r.credential : '';
            if (!token) return;

            window.__gsiDisabled = true;
            g.cancel();
            g.disableAutoSelect?.();

            onCredential(token);
          },
          auto_select: false,
          cancel_on_tap_outside: false,

          use_fedcm_for_prompt: true,
        });

        window.__gsiInitialized = true;
      }

      if (window.__gsiPrompting) return;
      window.__gsiPrompting = true;

      g.prompt();
      window.__gsiPrompting = false;
    })().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [disabled, onCredential]);

  return null;
}
