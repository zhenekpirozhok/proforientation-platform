'use client'

import { Form, Input, Button, Typography, message } from 'antd'
import Link from 'next/link'
import { useRouter } from '@/shared/i18n/lib/navigation'
import { useTranslations } from 'next-intl'
import { applyZodErrorsToAntdForm } from '@/shared/validation/antdZod'
import { loginSchema, type LoginSchemaValues } from '@/shared/validation/loginSchema'
import { useLoginUser } from '@/features/auth/login/model/useLoginUser'
import { useSessionStore } from '@/entities/session/model/store'
import { useGoogleOneTapLogin } from '@/features/auth/login/model/useGoogleOneTapLogin'
import { GoogleOneTapInit } from '@/features/auth/login/ui/GoogleOneTapInit'

const { Title, Text } = Typography

export function LoginForm() {
  const t = useTranslations('LoginPage')
  const [form] = Form.useForm<LoginSchemaValues>()
  const router = useRouter()

  const passwordLogin = useLoginUser()
  const googleLogin = useGoogleOneTapLogin()
  const user = useSessionStore((s) => s.user)

  async function loadMeAndGo() {
    const meRes = await fetch('/api/users/me', {
      credentials: 'include',
      cache: 'no-store',
    }).catch(() => null)

    if (!meRes || !meRes.ok) {
      useSessionStore.getState().setUser(null)
      message.error(t('Errors.Generic'))
      return
    }

    const me = await meRes.json().catch(() => null)
    useSessionStore.getState().setUser(me as any)

    message.success(t('Success'))
    router.replace('/me/results')
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-4">
      <GoogleOneTapInit
        disabled={!!user || googleLogin.isPending}
        onCredential={async (token) => {
          const res = await googleLogin.submit({ token })
          if (!res.ok) {
            message.error(res.message ?? t('Errors.Generic'))
            return
          }
          await loadMeAndGo()
        }}
      />

      <div className="py-10 sm:py-12">
        <div className="text-center">
          <Title level={2}>{t('Title')}</Title>
          <Text>{t('Subtitle')}</Text>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            onFinish={async (values) => {
              const parsed = loginSchema.safeParse(values)
              if (!parsed.success) {
                applyZodErrorsToAntdForm(form, parsed.error)
                return
              }

              const res = await passwordLogin.submit(parsed.data)
              if (!res.ok) {
                if (res.zodError) {
                  applyZodErrorsToAntdForm(form, res.zodError)
                  return
                }
                message.error(res.message ?? t('Errors.Generic'))
                return
              }

              await loadMeAndGo()
            }}
          >
            <Form.Item name="email" label={t('EmailLabel')}>
              <Input autoComplete="email" />
            </Form.Item>

            <Form.Item name="password" label={t('PasswordLabel')}>
              <Input.Password autoComplete="current-password" />
            </Form.Item>

            <div className="mb-3 flex justify-between text-sm">
              <Link href="/">{t('BackToHome')}</Link>
              <Link href="/forgot-password">{t('ForgotPassword')}</Link>
            </div>

            <Button
              htmlType="submit"
              type="primary"
              className="w-full"
              loading={passwordLogin.isPending || googleLogin.isPending}
            >
              {t('Submit')}
            </Button>

            <div className="mt-4 text-center">
              <Text>
                {t('NoAccount')}{' '}
                <Link href="/register">{t('CreateOne')}</Link>
              </Text>
            </div>
          </Form>
        </div>
      </div>
    </div>
  )
}
