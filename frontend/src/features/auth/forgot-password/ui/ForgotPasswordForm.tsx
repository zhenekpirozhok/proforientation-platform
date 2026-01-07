'use client';

import { useState } from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { applyZodErrorsToAntdForm } from '@/shared/validation/antdZod';
import {
  forgotPasswordSchema,
  type ForgotPasswordSchemaValues,
} from '@/shared/validation/forgotPasswordSchema';
import { useRequestPasswordReset } from '@/features/auth/forgot-password/model/useRequestPasswordReset';

const { Title, Text } = Typography;

export function ForgotPasswordForm() {
  const t = useTranslations('ForgotPasswordPage');
  const [form] = Form.useForm<ForgotPasswordSchemaValues>();
  const { submit, isPending } = useRequestPasswordReset();

  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (done) {
    return (
      <div className="mx-auto w-full max-w-[520px] px-4">
        <div className="py-10">
          <div className="text-center">
            <Title level={2} className="!mb-2">
              {t('CheckEmailTitle')}
            </Title>
            <Text type="secondary">{t('CheckEmailSubtitle')}</Text>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
              <div>{t('CheckEmailBody1')}</div>
              <div className="text-slate-600 dark:text-slate-300">
                {t('CheckEmailBody2')}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button onClick={() => setDone(false)}>{t('SendAgain')}</Button>
              <Button type="primary" href="/login">
                {t('GoToLogin')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[520px] px-4">
      <div className="py-10">
        <div className="text-center">
          <Title level={2} className="!mb-2">
            {t('Title')}
          </Title>
          <Text type="secondary">{t('Subtitle')}</Text>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          {errorMsg ? (
            <Alert type="error" showIcon message={errorMsg} className="mb-4" />
          ) : null}

          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            onFinish={async (values) => {
              setErrorMsg(null);
              const parsed = forgotPasswordSchema.safeParse(values);
              if (!parsed.success) {
                applyZodErrorsToAntdForm(form, parsed.error);
                return;
              }

              const res = await submit(parsed.data);

              if (!res.ok) {
                if (res.zodError) {
                  applyZodErrorsToAntdForm(form, res.zodError);
                  return;
                }
                setErrorMsg(res.message ?? t('GenericError'));
                return;
              }

              setDone(true);
            }}
          >
            <Form.Item name="email" label={t('EmailLabel')}>
              <Input
                placeholder="john.doe@example.com"
                autoComplete="email"
                inputMode="email"
              />
            </Form.Item>

            <Button
              htmlType="submit"
              type="primary"
              className="w-full"
              loading={isPending}
            >
              {t('Submit')}
            </Button>

            <div className="mt-4 text-center">
              <Text type="secondary">
                {t('BackToLoginPrefix')}{' '}
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-700"
                >
                  {t('BackToLoginLink')}
                </Link>
              </Text>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
