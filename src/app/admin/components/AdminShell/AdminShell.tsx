'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { signOut, redirectToHome } from '@/app/api/client/auth';
import type { AdminAccessProfile } from '@/app/admin/useAdminAccess';
import styles from './AdminShell.module.scss';

type NavKey = 'main' | 'users' | 'menu' | 'orders';

type AdminShellProps = {
  profile: AdminAccessProfile;
  active: NavKey;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
};

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7H20M4 12H20M4 17H20" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 11.5L12 5L20 11.5V19H14.5V14.5H9.5V19H4V11.5Z" fill="currentColor" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 11A4 4 0 1 0 9 3A4 4 0 1 0 9 11Z" fill="currentColor" />
      <path d="M17.5 12.5A3.5 3.5 0 1 0 17.5 5.5A3.5 3.5 0 1 0 17.5 12.5Z" fill="currentColor" opacity="0.68" />
      <path d="M3 20C3.85 16.85 6.65 14.75 10.5 14.75C14.35 14.75 17.15 16.85 18 20" fill="currentColor" />
      <path d="M14 20C14.55 18.15 16.2 16.85 18.55 16.85C20.6 16.85 22 17.85 22.6 20" fill="currentColor" opacity="0.68" />
    </svg>
  );
}

function MenuCardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 5H18C19.1046 5 20 5.89543 20 7V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V7C4 5.89543 4.89543 5 6 5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M8 9H16M8 12H16M8 15H13" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 4.5H18L19.5 8.5V18C19.5 19.1046 18.6046 20 17.5 20H6.5C5.39543 20 4.5 19.1046 4.5 18V8.5L6 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M4.5 8.5H19.5M9 12H15" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 4H7C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M14 8L19 12L14 16M19 12H10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

const NAV_ITEMS: Array<{ key: NavKey; href: string; label: string; icon: ReactNode }> = [
  { key: 'main', href: '/admin/main', label: 'Главная', icon: <HomeIcon /> },
  { key: 'users', href: '/admin/users', label: 'Пользователи', icon: <UsersIcon /> },
  { key: 'menu', href: '/admin/menu', label: 'Меню', icon: <MenuCardIcon /> },
  { key: 'orders', href: '/admin/orders', label: 'Заказы', icon: <OrdersIcon /> },
];

export default function AdminShell({
  profile,
  active,
  title,
  subtitle,
  actions,
  children,
}: AdminShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = useMemo(() => {
    const profileName = profile.name?.trim();

    if (profileName) {
      return profileName;
    }

    const emailName = profile.email.split('@')[0]?.trim();
    return emailName || 'Администратор';
  }, [profile.email, profile.name]);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await signOut();
      redirectToHome();
    } catch (error) {
      console.error('Admin logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <main className={styles.page}>
      <button
        type="button"
        className={`${styles.overlay} ${isMenuOpen ? styles.overlayVisible : ''}`}
        onClick={() => setIsMenuOpen(false)}
        aria-label="Закрыть меню"
      />

      <aside className={`${styles.sidebar} ${isMenuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarTop}>
          <Link href="/admin/main" className={styles.logoLink}>
            <img src="/logo.svg" alt="Логотип" className={styles.logo} />
          </Link>

          <div className={styles.profileCard}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>{displayName.slice(0, 1).toUpperCase()}</div>
            )}

            <div className={styles.profileMeta}>
              <p className={styles.profileName}>{displayName}</p>
              <p className={styles.profileRole}>Администратор системы</p>
            </div>
          </div>

          <nav className={styles.nav}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`${styles.navItem} ${active === item.key ? styles.navItemActive : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <button
          type="button"
          className={styles.logoutButton}
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogoutIcon />
          <span>{isLoggingOut ? 'Выходим...' : 'Выйти'}</span>
        </button>
      </aside>

      <section className={styles.content}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setIsMenuOpen(true)}
            aria-label="Открыть меню"
          >
            <MenuIcon />
          </button>

          <div className={styles.headingBlock}>
            <p className={styles.eyebrow}>Панель администратора</p>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>

          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>

        {children}
      </section>
    </main>
  );
}
