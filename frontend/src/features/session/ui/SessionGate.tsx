'use client'

import { useSessionBootstrap } from '@/features/session/model/useSessionBootstrap'

export function SessionGate() {
  useSessionBootstrap()
  return null
}
