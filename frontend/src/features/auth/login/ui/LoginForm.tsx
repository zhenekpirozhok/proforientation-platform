'use client';

import { Form, Input, Button, Typography, message } from 'antd';
import Link from 'next/link';
import { useRouter } from '@/shared/i18n/lib/navigation';
import { applyZodErrorsToAntdForm } from '@/shared/validation/antdZod';
import { loginSchema, type LoginSchemaValues } from '@/shared/validation/loginSchema';
import { useLoginUser } from '@/features/auth/login/model/useLoginUser';
import { useQuizPlayerStore } from '@/features/quiz-player/model/store';

const { Title, Text } = Typography;

export function LoginForm() {
  const [form] = Form.useForm<LoginSchemaValues>();
  const router = useRouter();
  const { submit, isPending } = useLoginUser();
  const attemptId = useQuizPlayerStore((s) => s.attemptId);

  return (
    <div className="mx-auto w-full max-w-[480px] px-4">
      <div className="py-10">
        <div className="text-center">
          <Title level={2} className="!mb-2">Sign in</Title>
          <Text type="secondary">Welcome back! Continue to your dashboard.</Text>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                message.error(res.message ?? 'Login failed');
                return;
              }

              message.success('Signed in');
              if (attemptId) router.push(`/results/${attemptId}`);
              else router.push('/my-career-profile');
            }}
          >
            <Form.Item name="email" label="Email">
              <Input placeholder="john.doe@example.com" autoComplete="email" />
            </Form.Item>

            <Form.Item name="password" label="Password">
              <Input.Password autoComplete="current-password" />
            </Form.Item>

            <div className="mb-3 flex items-center justify-between">
              <Link href="/" className="text-slate-600 hover:text-slate-800">
                Back to Home
              </Link>
              <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700">
                Forgot password?
              </Link>
            </div>

            <Button htmlType="submit" type="primary" className="w-full" loading={isPending}>
              Sign in
            </Button>

            <Button className="mt-3 w-full" disabled>
              Continue with Google
            </Button>

            <div className="mt-4 text-center">
              <Text type="secondary">
                No account?{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-700">
                  Create one
                </Link>
              </Text>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
