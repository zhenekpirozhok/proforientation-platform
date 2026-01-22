'use client';

import { Badge, Button, Card, Divider, Input, Tag, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { EntityConfig, FieldKey, LocaleKey } from '../model/types';

export type FormState = Record<FieldKey, string>;

function normalizeForm(s: FormState): FormState {
  return {
    title: s.title ?? '',
    text: s.text ?? '',
    description: s.description ?? '',
  };
}

function computeErrors(form: FormState, config: EntityConfig) {
  const errors: Partial<Record<FieldKey, string>> = {};
  for (const f of config.fields) {
    if (!f.required) continue;
    const v = (form[f.key] ?? '').trim();
    if (!v) errors[f.key] = 'required';
  }
  return errors;
}

export function TranslationEditorForm(props: {
  locale: LocaleKey;
  title: string;
  config: EntityConfig;
  form: FormState;
  saved: FormState;
  disabled: boolean;
  saving: boolean;
  onChange: (next: FormState) => void;
  onSave: () => Promise<void> | void;
  t: (
    key: string,
    values?: Record<string, string | number | Date> | undefined,
  ) => string;
}) {
  const {
    locale,
    title,
    config,
    form,
    saved,
    disabled,
    saving,
    onChange,
    onSave,
    t,
  } = props;

  const fields = useMemo(
    () => config.fields.map((x) => x.key),
    [config.fields],
  );

  const dirty = useMemo(() => {
    const a = normalizeForm(form);
    const b = normalizeForm(saved);
    for (const f of fields) {
      if ((a[f] ?? '') !== (b[f] ?? '')) return true;
    }
    return false;
  }, [form, saved, fields]);

  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>(
    {},
  );
  const errors = useMemo(() => computeErrors(form, config), [form, config]);

  const refs = useRef<
    Partial<Record<FieldKey, HTMLInputElement | HTMLTextAreaElement | null>>
  >({});

  useEffect(() => {
    // reset touched when locale changes; avoid sync state update inside effect
    const id = setTimeout(() => setTouched({}), 0);
    return () => clearTimeout(id);
  }, [locale]);

  const canSave = !disabled && dirty && Object.keys(errors).length === 0;

  function setField(key: FieldKey, value: string) {
    onChange({ ...form, [key]: value });
  }

  function markTouched(key: FieldKey) {
    setTouched((p) => ({ ...p, [key]: true }));
  }

  function firstInvalidKey() {
    for (const f of config.fields) {
      if (!f.required) continue;
      if (errors[f.key]) return f.key;
    }
    return null;
  }

  async function handleSave() {
    const k = firstInvalidKey();
    if (k) {
      setTouched((p) => ({ ...p, [k]: true }));
      const el = refs.current[k];
      if (el) el.focus();
      return;
    }
    await onSave();
  }

  return (
    <Card className="!rounded-2xl" bodyStyle={{ padding: 16 }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Typography.Title level={4} className="!m-0 truncate">
            {title}
          </Typography.Title>
          {dirty ? (
            <Tag color="gold" className="m-0">
              {t('unsaved')}
            </Tag>
          ) : null}
        </div>

        <Button
          type="primary"
          onClick={handleSave}
          loading={saving}
          disabled={!canSave}
        >
          {t('saveLocale', { locale: locale.toUpperCase() })}
        </Button>
      </div>

      <Divider className="!my-3" />

      <div className="flex flex-col gap-4">
        {config.fields.map((f) => {
          const value = form[f.key] ?? '';
          const showError = !!errors[f.key] && !!touched[f.key];
          const help = showError ? t('fieldRequiredHelp') : ' ';
          const status: 'error' | undefined = showError ? 'error' : undefined;

          return (
            <div key={f.key} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Typography.Text>{t(f.labelKey)}</Typography.Text>
                {f.required ? (
                  <Badge
                    status="error"
                    text={
                      <Typography.Text type="secondary">
                        {t('required')}
                      </Typography.Text>
                    }
                  />
                ) : null}
              </div>

              {f.input === 'input' ? (
                <Input
                  value={value}
                  onChange={(e) => setField(f.key, e.target.value)}
                  onBlur={() => markTouched(f.key)}
                  size="large"
                  placeholder={t(f.placeholderKey)}
                  disabled={disabled}
                  status={status}
                  ref={(node) => {
                    refs.current[f.key] = (node?.input ??
                      null) as HTMLInputElement | null;
                  }}
                />
              ) : (
                <Input.TextArea
                  value={value}
                  onChange={(e) => setField(f.key, e.target.value)}
                  onBlur={() => markTouched(f.key)}
                  placeholder={t(f.placeholderKey)}
                  autoSize={{ minRows: 4, maxRows: 12 }}
                  disabled={disabled}
                  status={status}
                  ref={(node) => {
                    refs.current[f.key] = (node?.resizableTextArea?.textArea ??
                      null) as HTMLTextAreaElement | null;
                  }}
                />
              )}

              <Typography.Text
                type={showError ? 'danger' : 'secondary'}
                className="text-xs"
              >
                {help}
              </Typography.Text>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
