'use client';

import { useMemo } from 'react';
import { useSessionBootstrap } from '@/features/session/model/useSessionBootstrap';

function hasSessionCookie() {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('SESSION') || document.cookie.includes('JSESSIONID') || document.cookie.includes('access');
}

export function SessionGate({ onlyIfCookie = true }: { onlyIfCookie?: boolean }) {
  const enabled = useMemo(() => (onlyIfCookie ? hasSessionCookie() : true), [onlyIfCookie]);
  useSessionBootstrap(enabled);
  return null;
}
