'use client';

import { Form, Input, Button, Typography, message } from 'antd';
import Link from 'next/link';
import { useRouter } from '@/shared/i18n/lib/navigation';
import { useTranslations } from 'next-intl';
import { applyZodErrorsToAntdForm } from '@/shared/validation/antdZod';
import {
  registerSchema,
  type RegisterSchemaValues,
} from '@/shared/validation/registerSchema';
import { useRegisterThenLogin } from '@/features/auth/register/model/useRegisterThenLogin';
import { useGoogleOneTapLogin } from '@/features/auth/login/model/useGoogleOneTapLogin';
import { GoogleOneTapInit } from '@/features/auth/login/ui/GoogleOneTapInit';

const { Title, Text } = Typography;

export function RegisterForm() {
  const t = useTranslations('RegisterPage');
  const [form] = Form.useForm<RegisterSchemaValues>();
  const router = useRouter();
  const { submit, isPending } = useRegisterThenLogin();
  const google = useGoogleOneTapLogin();

  async function redirectAfterSuccess() {
    router.push('/me/results');
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-4">
      <GoogleOneTapInit
        disabled={google.isPending}
        onCredential={async (token) => {
          const res = await google.submit({ token });
          if (!res.ok) {
            message.error(res.message ?? t('Errors.Generic'));
            return;
          }
          message.success(t('Success'));
          await redirectAfterSuccess();
        }}
      />

      <div className="py-10 sm:py-12">
        <div className="text-center">
          <Title
            level={2}
            className="!mb-2 !text-slate-900 dark:!text-slate-100"
          >
            {t('Title')}
          </Title>
          <Text className="!text-slate-600 dark:!text-slate-300">
            {t('Subtitle')}
          </Text>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            onFinish={async (values) => {
              const parsed = registerSchema.safeParse(values);
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
                message.error(res.message ?? t('Errors.Generic'));
                return;
              }

              message.success(t('Success'));
              await redirectAfterSuccess();
            }}
          >
            <Form.Item
              name="email"
              label={
                <span className="text-slate-900 dark:text-slate-100">
                  {t('EmailLabel')}
                </span>
              }
            >
              <Input placeholder={t('EmailPlaceholder')} autoComplete="email" />
            </Form.Item>

            <Form.Item
              name="displayName"
              label={
                <span className="text-slate-900 dark:text-slate-100">
                  {t('NameLabel')}
                </span>
              }
            >
              <Input placeholder={t('NamePlaceholder')} autoComplete="name" />
            </Form.Item>

            <Form.Item
              name="password"
              label={
                <span className="text-slate-900 dark:text-slate-100">
                  {t('PasswordLabel')}
                </span>
              }
            >
              <Input.Password
                autoComplete="new-password"
                placeholder={t('PasswordPlaceholder')}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={
                <span className="text-slate-900 dark:text-slate-100">
                  {t('ConfirmPasswordLabel')}
                </span>
              }
            >
              <Input.Password
                autoComplete="new-password"
                placeholder={t('ConfirmPasswordPlaceholder')}
              />
            </Form.Item>

            <Button
              htmlType="submit"
              type="primary"
              className="w-full"
              loading={isPending || google.isPending}
            >
              {t('Submit')}
            </Button>

            <div className="mt-4 text-center">
              <Text className="!text-slate-600 dark:!text-slate-300">
                {t('HaveAccount')}{' '}
                <Link
                  href="/login"
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  {t('SignIn')}
                </Link>
              </Text>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
