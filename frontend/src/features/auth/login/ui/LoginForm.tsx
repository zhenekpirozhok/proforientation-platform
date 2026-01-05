'use client';

import { Form, Input, Button, Typography, message } from 'antd';
import Link from 'next/link';
import { useRouter } from '@/shared/i18n/lib/navigation';
import { useTranslations } from 'next-intl';
import { applyZodErrorsToAntdForm } from '@/shared/validation/antdZod';
import { loginSchema, type LoginSchemaValues } from '@/shared/validation/loginSchema';
import { useLoginUser } from '@/features/auth/login/model/useLoginUser';

const { Title, Text } = Typography;

export function LoginForm() {
  const t = useTranslations('LoginPage');
  const [form] = Form.useForm<LoginSchemaValues>();
  const router = useRouter();
  const { submit, isPending } = useLoginUser();

  return (
    <div className="mx-auto w-full max-w-[480px] px-4">
      <div className="py-10 sm:py-12">
        <div className="text-center">
          <Title level={2} className="!mb-2 !text-slate-900 dark:!text-slate-100">
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
              const parsed = loginSchema.safeParse(values);
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
              router.push('/me/results');
            }}
          >
            <Form.Item name="email" label={<span className="text-slate-900 dark:text-slate-100">{t('EmailLabel')}</span>}>
              <Input placeholder={t('EmailPlaceholder')} autoComplete="email" />
            </Form.Item>

            <Form.Item name="password" label={<span className="text-slate-900 dark:text-slate-100">{t('PasswordLabel')}</span>}>
              <Input.Password autoComplete="current-password" placeholder={t('PasswordPlaceholder')} />
            </Form.Item>

            <div className="mb-3 flex items-center justify-between text-sm">
              <Link href="/" className="text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100">
                {t('BackToHome')}
              </Link>

              <Link href="/forgot-password" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                {t('ForgotPassword')}
              </Link>
            </div>

            <Button htmlType="submit" type="primary" className="w-full" loading={isPending}>
              {t('Submit')}
            </Button>

            <Button className="mt-3 w-full" disabled>
              {t('Google')}
            </Button>

            <div className="mt-4 text-center">
              <Text className="!text-slate-600 dark:!text-slate-300">
                {t('NoAccount')}{' '}
                <Link href="/register" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                  {t('CreateOne')}
                </Link>
              </Text>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
