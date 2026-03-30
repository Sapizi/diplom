'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/app/api/client/auth';
import { getCourierDisplayName } from './courierHelpers';
import styles from './courierFrame.module.scss';

type CourierMenuProfile = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  isOpen: boolean | null;
};

type CourierMenuProps = {
  profile: CourierMenuProfile;
  isOpen: boolean;
  onClose: () => void;
  active: 'main' | 'history' | 'settings';
};

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7H20M4 12H20M4 17H20" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
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

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 7V12L15 13.5M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C14.53 4 16.78 5.17 18.24 7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M15 4H20V9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M19.5 12L21 12M3 12L4.5 12M12 4.5V3M12 21V19.5M17.3033 6.6967L18.3639 5.63604M5.63604 18.3639L6.6967 17.3033M17.3033 17.3033L18.3639 18.3639M5.63604 5.63604L6.6967 6.6967"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M18.77 16.95L15.94 16.62C15.62 16.58 15.3 16.61 15 16.72C14.69 16.83 14.42 17 14.2 17.23L12.15 19.28C9 17.68 6.32 15 4.72 11.85L6.77 9.8C7 9.58 7.17 9.31 7.28 9C7.39 8.7 7.42 8.38 7.38 8.06L7.05 5.23C7 4.88 6.83 4.56 6.57 4.33C6.3 4.1 5.96 3.98 5.61 4H3.66C2.68 4 1.87 4.82 1.93 5.8C2.38 13.27 8.73 19.62 16.2 20.07C17.18 20.13 18 19.32 18 18.34V16.39C18.02 16.04 17.9 15.7 17.67 15.43C17.44 15.17 17.12 15 16.77 14.95L18.77 16.95Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
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

export function CourierMenuButton({
  onClick,
  ariaLabel = 'Открыть меню',
}: {
  onClick: () => void;
  ariaLabel?: string;
}) {
  return (
    <button type="button" className={styles.menuButton} onClick={onClick} aria-label={ariaLabel}>
      <MenuIcon />
    </button>
  );
}

export default function CourierMenu({ profile, isOpen, onClose, active }: CourierMenuProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = useMemo(() => getCourierDisplayName(profile), [profile]);
  const shiftStatus = profile.isOpen ? 'Смена открыта' : 'Смена не открыта';

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Courier logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Закрыть меню"
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
      />

      <aside className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.drawerHeader}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className={styles.avatar} />
          ) : (
            <div className={styles.avatarFallback}>{displayName.slice(0, 1).toUpperCase()}</div>
          )}

          <div className={styles.identity}>
            <h2 className={styles.name}>{displayName}</h2>
            <p className={styles.shiftStatus}>{shiftStatus}</p>
          </div>
        </div>

        <nav className={styles.menu}>
          <Link
            href="/courer/main"
            className={`${styles.menuItem} ${active === 'main' ? styles.menuItemActive : ''}`}
            onClick={onClose}
          >
            <HomeIcon />
            <span>Главная</span>
          </Link>

          <Link
            href="/courer/history"
            className={`${styles.menuItem} ${active === 'history' ? styles.menuItemActive : ''}`}
            onClick={onClose}
          >
            <HistoryIcon />
            <span>История</span>
          </Link>

          <Link
            href="/courer/settings"
            className={`${styles.menuItem} ${active === 'settings' ? styles.menuItemActive : ''}`}
            onClick={onClose}
          >
            <SettingsIcon />
            <span>Настройки</span>
          </Link>

          <a href="tel:+79000848683" className={styles.menuItem}>
            <PhoneIcon />
            <span>Позвонить менеджеру</span>
          </a>

          <button
            type="button"
            className={`${styles.menuItem} ${styles.logoutButton}`}
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogoutIcon />
            <span>{isLoggingOut ? 'Выходим...' : 'Выйти'}</span>
          </button>
        </nav>
      </aside>
    </>
  );
}
