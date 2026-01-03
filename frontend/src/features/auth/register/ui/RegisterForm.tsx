'use client';

import { Form, Input, Button, Typography, message } from 'antd';
import Link from 'next/link';
import { useRouter } from '@/shared/i18n/lib/navigation';
import { applyZodErrorsToAntdForm } from '@/shared/validation/antdZod';
import { type RegisterSchemaValues } from '@/shared/validation/registerSchema';
import { useRegisterThenLogin } from '@/features/auth/register/model/useRegisterThenLogin';
import { useQuizPlayerStore } from '@/features/quiz-player/model/store';

const { Title, Text } = Typography;

export function RegisterForm() {
  const [form] = Form.useForm<RegisterSchemaValues>();
  const router = useRouter();
  const { submit, isPending } = useRegisterThenLogin();
  const attemptId = useQuizPlayerStore((s) => s.attemptId);

  return (
    <div className="mx-auto w-full max-w-[480px] px-4">
      <div className="py-10">
        <div className="text-center">
          <Title level={2} className="!mb-2">
            Sign up
          </Title>
          <Text type="secondary">Create your account to continue.</Text>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            onFinish={async (values) => {
              const res = await submit(values);

              if (!res.ok) {
                if (res.zodError) {
                  applyZodErrorsToAntdForm(form, res.zodError);
                  return;
                }
                message.error(res.message ?? 'Something went wrong');
                return;
              }

              message.success('Signed in');
              if (attemptId) {
                router.push(`/results/${attemptId}`);
              } else {
                router.push('/my-career-profile');
              }
            }}
          >
            <Form.Item name="email" label="Email">
              <Input placeholder="john.doe@example.com" autoComplete="email" />
            </Form.Item>

            <Form.Item name="displayName" label="Name">
              <Input placeholder="John Doe" autoComplete="name" />
            </Form.Item>

            <Form.Item name="password" label="Password">
              <Input.Password autoComplete="new-password" />
            </Form.Item>

            <Form.Item name="confirmPassword" label="Confirm password">
              <Input.Password autoComplete="new-password" />
            </Form.Item>

            <Button htmlType="submit" type="primary" className="w-full" loading={isPending}>
              Create account
            </Button>

            <Button className="mt-3 w-full" disabled>
              Continue with Google
            </Button>

            <div className="mt-4 text-center">
              <Text type="secondary">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700">
                  Sign in
                </Link>
              </Text>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
