'use client'

import { useLoginUser } from '@/features/auth/login/model/useLoginUser'
import { useGoogleOneTapLogin } from '@/features/auth/login/model/useGoogleOneTapLogin'

export function useAuthLogin() {
    const password = useLoginUser()
    const google = useGoogleOneTapLogin()

    return {
        submitPassword: password.submit,
        submitGoogleOneTap: google.submit,
        isPending: password.isPending || google.isPending,
    }
}
