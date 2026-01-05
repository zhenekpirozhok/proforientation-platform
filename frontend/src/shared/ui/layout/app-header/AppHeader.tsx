'use client';

import { Button, Select, Avatar, Dropdown } from 'antd';
import { MenuOutlined, SettingOutlined, LogoutOutlined, LoginOutlined, UserOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

import { MobileNavDrawer } from './MobileNavDrawer';
import { ThemeToggle } from '@/shared/ui/theme/theme-toggle/ThemeToggle';
import { Link, usePathname, useRouter } from '@/shared/i18n/lib/navigation';
import { useSessionStore } from '@/entities/session/model/store';
import { hasRole } from '@/entities/session/model/roles';
import { useLogoutUser } from '@/features/auth/logout/model/useLogoutUser';

import './app-header.css';

type Locale = 'en' | 'ru';
type NavItem = { key: string; label: string; href: string; show: boolean };

export function AppHeader() {
  const [open, setOpen] = useState(false);

  const tHeader = useTranslations('Header');
  const tCommon = useTranslations('Common');

  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const status = useSessionStore((s) => s.status);
  const user = useSessionStore((s) => s.user);

  const isAuthenticated = status === 'auth';
  const isAdmin = hasRole(user, 'ADMIN');
  const logoutM = useLogoutUser()


  const navItems = useMemo<NavItem[]>(
    () => [
      { key: 'quizzes', label: tHeader('quizzes'), href: '/quizzes', show: true },
      { key: 'profile', label: tHeader('profile'), href: '/me/results', show: isAuthenticated },
      { key: 'admin', label: tHeader('admin'), href: '/admin', show: isAdmin },
    ],
    [tHeader, isAuthenticated, isAdmin],
  );

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const onLocaleChange = (nextLocale: Locale) => {
    router.replace(pathname, { locale: nextLocale });
  };

  const onSignIn = () => {
    router.push(`/login`)
  };

  const onLogout = async () => {
    await logoutM.mutateAsync().catch(() => {})
    router.push('/')
  }

  const userLabel = user?.displayName?.trim() || user?.email || 'User';

  const dropdownItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: tHeader('profile'),
      onClick: () => router.push('/my-career-profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: tHeader('settings') ?? 'Settings',
      onClick: () => router.push('/my-career-profile'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: tHeader('logout') ?? 'Logout',
      onClick: onLogout,
    },
  ];

  return (
    <>
      <div className="flex h-16 items-center justify-between" style={{ background: 'transparent' }}>
        <div className="flex items-center gap-6">
          <Link href="/" locale={locale} className="flex items-center gap-2">
            <Image src="/images/logo.svg" alt={tHeader('brand')} width={28} height={28} priority />
            <span className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">
              {tHeader('brand')}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems
              .filter((i) => i.show)
              .map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    locale={locale}
                    className={[
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? '!text-[#4F46E5] dark:!text-[#818CF8]'
                        : '!text-slate-700 hover:!text-slate-900 dark:!text-slate-300 dark:hover:!text-slate-100',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                );
              })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <Select
              value={locale}
              onChange={onLocaleChange}
              options={[
                { value: 'en', label: tCommon('english') },
                { value: 'ru', label: tCommon('russian') },
              ]}
              className="cp-lang-select w-[140px]"
              classNames={{ popup: { root: 'cp-lang-dropdown' } }}
              popupMatchSelectWidth={false}
              aria-label={tCommon('language')}
            />
          </div>

          <ThemeToggle />

          {isAuthenticated ? (
            <Dropdown menu={{ items: dropdownItems as any }} placement="bottomRight" trigger={['click']}>
              <button
                type="button"
                className="hidden items-center gap-2 rounded-full px-2 py-1 text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-900 md:flex"
                aria-label={tHeader('userMenu')}
              >
                <Avatar size="small" />
                <span className="hidden md:inline">{userLabel}</span>
                <SettingOutlined />
              </button>
            </Dropdown>
          ) : (
            <div className="hidden md:block">
              <Button type="primary" icon={<LoginOutlined />} onClick={onSignIn}>
                {tHeader('signIn')}
              </Button>
            </div>
          )}

          <div className="md:hidden">
            <Button
              type="text"
              aria-label="Open menu"
              icon={<MenuOutlined />}
              className="text-slate-700 dark:text-slate-200"
              onClick={() => setOpen(true)}
            />
          </div>
        </div>
      </div>

      <MobileNavDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
