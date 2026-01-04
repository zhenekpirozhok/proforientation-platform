import type { SessionUser } from './store';

export function hasAuthority(user: SessionUser | null, authority: string) {
    return Boolean(user?.authorities?.some((a) => a.authority === authority));
}

export function hasRole(user: SessionUser | null, role: string) {
    if (user?.role === role) return true;
    return hasAuthority(user, `ROLE_${role}`);
}
