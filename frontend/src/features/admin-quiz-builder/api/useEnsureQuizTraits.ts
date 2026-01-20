'use client';

import { useCallback } from 'react';
import { message } from 'antd';

import { useAdminQuizBuilderStore } from '../model/store';
import type { ScaleDraft } from '../model/store';
import type { CreateTraitRequest } from '@/shared/api/generated/model';
import type { ReturnTypeUseQuizBuilderActions } from '../api/useQuizBuilderActions';

function isBipolarPair(s: ScaleDraft) {
  return (
    s.polarity === 'bipolar' &&
    !!s.pairId &&
    (s.side === 'LEFT' || s.side === 'RIGHT')
  );
}

function groupBipolar(scales: ScaleDraft[]) {
  const m = new Map<string, ScaleDraft[]>();
  for (const s of scales) {
    if (!isBipolarPair(s)) continue;
    m.set(s.pairId as string, [...(m.get(s.pairId as string) ?? []), s]);
  }
  return Array.from(m.entries()).map(([pairId, arr]) => ({ pairId, arr }));
}

export function useEnsureQuizTraits(
  actions: ReturnTypeUseQuizBuilderActions | null,
) {
  const scales = useAdminQuizBuilderStore((s) => s.scales);
  const patchScale = useAdminQuizBuilderStore((s) => s.patchScale);

  return useCallback(async () => {
    if (!actions) return true;

    const missing = scales.filter((s) => typeof s.traitId !== 'number');
    if (missing.length === 0) return true;

    try {
      const single = missing.filter((s) => s.polarity === 'single');
      for (const s of single) {
        const payload: CreateTraitRequest = {
          code: s.code,
          name: s.name,
          description: s.description,
        };
        const res = await actions.createTrait.mutateAsync({ data: payload });
        const traitId = (res as unknown as Record<string, unknown>)?.id as
          | number
          | undefined;
        if (typeof traitId === 'number') patchScale(s.tempId, { traitId });
      }

      const bipolarGroups = groupBipolar(missing);
      for (const g of bipolarGroups) {
        const left = g.arr.find((x) => x.side === 'LEFT');
        const right = g.arr.find((x) => x.side === 'RIGHT');
        if (!left || !right) continue;

        const pairCode = (
          left.bipolarPairCode ||
          right.bipolarPairCode ||
          ''
        ).trim();

        const payloadLeft: CreateTraitRequest = {
          code: left.code,
          name: left.name,
          description: left.description,
          bipolarPairCode: pairCode,
        };

        const payloadRight: CreateTraitRequest = {
          code: right.code,
          name: right.name,
          description: right.description,
          bipolarPairCode: pairCode,
        };

        const resL = await actions.createTrait.mutateAsync({
          data: payloadLeft,
        });
        const resR = await actions.createTrait.mutateAsync({
          data: payloadRight,
        });

        const leftId = (resL as unknown as Record<string, unknown>)?.id as
          | number
          | undefined;
        const rightId = (resR as unknown as Record<string, unknown>)?.id as
          | number
          | undefined;

        if (typeof leftId === 'number')
          patchScale(left.tempId, { traitId: leftId });
        if (typeof rightId === 'number')
          patchScale(right.tempId, { traitId: rightId });
      }

      return true;
    } catch (e) {
      message.error((e as Error).message);
      return false;
    }
  }, [actions, scales, patchScale]);
}
