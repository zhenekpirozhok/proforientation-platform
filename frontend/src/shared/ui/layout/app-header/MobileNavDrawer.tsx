'use client';

import { Drawer, Menu, Avatar, Select, Button } from 'antd';
import type { MenuProps } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/shared/i18n/lib/navigation';
import { useSessionStore } from '@/entities/session/model/store';
import { hasRole } from '@/entities/session/model/roles';
import { useLogoutUser } from '@/features/auth/logout/model/useLogoutUser';


type Props = {
  open: boolean;
  onClose: () => void;
};

type NavItem = {
  key: string;
  label: string;
  href: string;
  show: boolean;
};

export function MobileNavDrawer({ open, onClose }: Props) {
  const locale = useLocale() as 'en' | 'ru';
  const tDrawer = useTranslations('Drawer');
  const tCommon = useTranslations('Common');

  const router = useRouter();
  const pathname = usePathname();

  const status = useSessionStore((s) => s.status);
  const user = useSessionStore((s) => s.user);

  const isAuthenticated = status === 'auth';
  const isAdmin = hasRole(user, 'ADMIN');
  const logoutM = useLogoutUser()


  const navItems: NavItem[] = [
    { key: 'quizzes', label: tDrawer('quizzes'), href: '/quizzes', show: true },
    { key: 'profile', label: tDrawer('profile') ?? 'Profile', href: '/me/results', show: isAuthenticated },
    { key: 'admin', label: tDrawer('admin'), href: '/admin', show: isAdmin },
  ];

  const visibleItems = navItems.filter((i) => i.show);

  const hrefByKey = new Map(visibleItems.map((i) => [i.key, i.href]));

  const menuItems: MenuProps['items'] = visibleItems.map((i) => ({
    key: i.key,
    label: i.label,
  }));

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    const href = hrefByKey.get(String(key));
    if (!href) return;
    router.push(href);
    onClose();
  };

  const onLocaleChange = (nextLocale: 'en' | 'ru') => {
    router.replace(pathname, { locale: nextLocale });
    onClose();
  };

  const onSignIn = () => {
    router.push(`/login`)
    onClose();
  };

  const onLogout = async () => {
    await logoutM.mutateAsync().catch(() => {})
    router.push('/')
    onClose()
  }

  const userLabel = user?.displayName?.trim() || user?.email || 'User';

  return (
    <Drawer placement="right" open={open} onClose={onClose}>
      {isAuthenticated ? (
        <div className="mb-6 flex items-center gap-3">
          <Avatar size={48} />
          <div className="font-medium">{userLabel}</div>
        </div>
      ) : (
        <div className="mb-6">
          <Button type="primary" className="w-full" onClick={onSignIn}>
            {tDrawer('signIn') ?? 'Sign in'}
          </Button>
        </div>
      )}

      <Menu mode="inline" items={menuItems} onClick={onMenuClick} />

      <div className="mt-6 flex flex-col gap-3">
        {isAuthenticated ? (
          <Button danger className="w-full" onClick={onLogout}>
            {tDrawer('logout') ?? 'Logout'}
          </Button>
        ) : null}

        <Select
          value={locale}
          onChange={onLocaleChange}
          options={[
            { value: 'en', label: tCommon('english') },
            { value: 'ru', label: tCommon('russian') },
          ]}
          className="w-full"
          aria-label={tCommon('language')}
        />
      </div>
    </Drawer>
  );
}
