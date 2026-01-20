'use client';

import { useCallback, useMemo, useState } from 'react';

export type StepErrors = Record<string, string>;

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

export function useStepValidation(params: {
  errors: StepErrors;
  submitAttempted?: boolean;
}) {
  const { errors, submitAttempted: submitAttemptedExternal } = params;

  const [touched, setTouched] = useState<Record<string, true>>({});
  const [submitAttemptedLocal, setSubmitAttemptedLocal] = useState(false);

  const submitAttempted = Boolean(
    submitAttemptedExternal || submitAttemptedLocal,
  );

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }, []);

  const attemptSubmit = useCallback(() => {
    setSubmitAttemptedLocal(true);
  }, []);

  const resetStepValidation = useCallback(() => {
    setTouched({});
    setSubmitAttemptedLocal(false);
  }, []);

  const showError = useCallback(
    (field: string) => {
      if (!errors?.[field]) return false;
      return submitAttempted || Boolean(touched[field]);
    },
    [errors, submitAttempted, touched],
  );

  const fieldStatus = useCallback(
    (field: string) => (showError(field) ? ('error' as const) : undefined),
    [showError],
  );

  const visibleErrors = useMemo(() => {
    const keys = Object.keys(errors ?? {});
    const shown = submitAttempted ? keys : keys.filter((k) => touched[k]);
    return uniq(shown)
      .map((k) => ({ field: k, code: errors[k] }))
      .filter((x) => Boolean(x.code));
  }, [errors, submitAttempted, touched]);

  return {
    touched,
    submitAttempted,
    attemptSubmit,
    resetStepValidation,
    markTouched,
    showError,
    fieldStatus,
    visibleErrors,
  };
}
