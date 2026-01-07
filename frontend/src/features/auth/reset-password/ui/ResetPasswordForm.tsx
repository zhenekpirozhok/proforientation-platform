'use client';

import { useEffect, useMemo, useState } from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { applyZodErrorsToAntdForm } from '@/shared/validation/antdZod';
import {
  resetPasswordSchema,
  type ResetPasswordSchemaValues,
} from '@/shared/validation/resetPasswordSchema';
import { useResetPassword } from '@/features/auth/reset-password/model/useResetPassword';
import { useRouter } from '@/shared/i18n/lib/navigation';

const { Title, Text } = Typography;

export function ResetPasswordForm() {
  const t = useTranslations('ResetPasswordPage');
  const sp = useSearchParams();
  const router = useRouter();
  const tokenFromUrl = useMemo(() => (sp.get('token') ?? '').trim(), [sp]);

  const [form] = Form.useForm<ResetPasswordSchemaValues>();
  const { submit, isPending } = useResetPassword();

  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenFromUrl) return;
    form.setFieldsValue({ token: tokenFromUrl });
  }, [form, tokenFromUrl]);

  if (!tokenFromUrl && !done) {
    return (
      <div className="mx-auto w-full max-w-[520px] px-4">
        <div className="py-10">
          <div className="text-center">
            <Title level={2} className="!mb-2">
              {t('MissingTokenTitle')}
            </Title>
            <Text type="secondary">{t('MissingTokenSubtitle')}</Text>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <Alert type="warning" showIcon message={t('MissingTokenAlert')} />
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button onClick={() => router.push('/forgot-password')}>
                {t('RequestNewLink')}
              </Button>
              <Button type="primary" href="/login">
                {t('GoToLogin')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-[520px] px-4">
        <div className="py-10">
          <div className="text-center">
            <Title level={2} className="!mb-2">
              {t('SuccessTitle')}
            </Title>
            <Text type="secondary">{t('SuccessSubtitle')}</Text>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="text-sm text-slate-700 dark:text-slate-200">
              {t('SuccessBody')}
            </div>
            <div className="mt-6">
              <Button type="primary" className="w-full" href="/login">
                {t('SignIn')}
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

              const parsed = resetPasswordSchema.safeParse({
                ...values,
                token: tokenFromUrl || values.token,
              });

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
            <Form.Item name="token" hidden>
              <Input />
            </Form.Item>

            <Form.Item name="password" label={t('PasswordLabel')}>
              <Input.Password autoComplete="new-password" />
            </Form.Item>

            <Form.Item name="confirmPassword" label={t('ConfirmPasswordLabel')}>
              <Input.Password autoComplete="new-password" />
            </Form.Item>

            <div className="mb-3 text-xs text-slate-600 dark:text-slate-300">
              {t('PasswordHint')}
            </div>

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
