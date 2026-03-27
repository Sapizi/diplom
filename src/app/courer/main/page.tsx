'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useCourerAccess } from '../useCourerAccess';
import styles from './page.module.scss';

function CalendarIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M5.25 1.5V3M12.75 1.5V3M2.25 6H15.75M4.5 4.5H13.5C14.7426 4.5 15.75 5.50736 15.75 6.75V14.25C15.75 15.4926 14.7426 16.5 13.5 16.5H4.5C3.25736 16.5 2.25 15.4926 2.25 14.25V6.75C2.25 5.50736 3.25736 4.5 4.5 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path d="M5.25 8.625H6.375V9.75H5.25V8.625Z" fill="currentColor" />
      <path d="M8.4375 8.625H9.5625V9.75H8.4375V8.625Z" fill="currentColor" />
      <path d="M11.625 8.625H12.75V9.75H11.625V8.625Z" fill="currentColor" />
      <path d="M5.25 11.8125H6.375V12.9375H5.25V11.8125Z" fill="currentColor" />
      <path d="M8.4375 11.8125H9.5625V12.9375H8.4375V11.8125Z" fill="currentColor" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M9 4.5V9L12 10.5M15.75 9C15.75 12.7279 12.7279 15.75 9 15.75C5.27208 15.75 2.25 12.7279 2.25 9C2.25 5.27208 5.27208 2.25 9 2.25C11.1348 2.25 13.038 3.2415 14.2741 4.78814"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path d="M12.75 2.25H15.75V5.25" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M14.9057 12.2475L12.8857 11.94C12.6557 11.9044 12.4204 11.9251 12.2001 12.0004C11.9798 12.0757 11.7808 12.2035 11.6207 12.3725L10.157 13.8362C7.9007 12.6872 6.06282 10.8493 4.91382 8.59298L6.37757 7.12923C6.54654 6.96912 6.67431 6.77017 6.7496 6.54984C6.82488 6.32951 6.84563 6.09419 6.81007 5.86423L6.50257 3.84423C6.4463 3.47544 6.25885 3.13931 5.97448 2.89715C5.69012 2.65499 5.32885 2.52309 4.95532 2.52548H3.57757C2.72132 2.52548 2.00757 3.23923 2.06257 4.09548C2.47757 10.5055 7.4942 15.5142 13.9042 15.9292C14.7604 15.9842 15.4742 15.2705 15.4742 14.4142V13.0365C15.4768 12.6629 15.3449 12.3015 15.1027 12.0171C14.8605 11.7327 14.5244 11.5452 14.1557 11.489L14.9057 12.2475Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M9 3.5625C5.99795 3.5625 3.5625 5.99795 3.5625 9C3.5625 12.002 5.99795 14.4375 9 14.4375C12.002 14.4375 14.4375 12.002 14.4375 9C14.4375 5.99795 12.002 3.5625 9 3.5625ZM9 11.625C7.55025 11.625 6.375 10.4498 6.375 9C6.375 7.55025 7.55025 6.375 9 6.375C10.4498 6.375 11.625 7.55025 11.625 9C11.625 10.4498 10.4498 11.625 9 11.625Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M9 1.5V3M9 15V16.5M3 9H1.5M16.5 9H15M4.75736 4.75736L3.6967 3.6967M14.3033 14.3033L13.2426 13.2426M4.75736 13.2426L3.6967 14.3033M14.3033 3.6967L13.2426 4.75736"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function CourerMainPage() {
  const { profile, isChecking, reloadProfile } = useCourerAccess();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const displayName = useMemo(() => {
    const profileName = profile?.name?.trim();

    if (profileName) {
      return profileName;
    }

    const emailName = profile?.email.split('@')[0]?.trim();
    return emailName || 'Курьер';
  }, [profile]);

  const shiftIsOpen = Boolean(profile?.isOpen);
  const shiftStatus = shiftIsOpen ? 'Смена открыта' : 'Смена не открыта';

  if (isChecking) {
    return (
      <main className={styles.page}>
        <div className={styles.viewport}>
          <p className={styles.loading}>Проверяем доступ...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <main className={styles.page}>
      <div className={styles.viewport}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setIsMenuOpen(true)}
          aria-label="Открыть меню"
        >
          <span />
          <span />
          <span />
        </button>

        <section className={styles.stateCard}>
          <img src="/zamok.svg" alt="Смена закрыта" className={styles.lockIcon} />
          <h1 className={styles.title}>Смена не открыта</h1>
          <p className={styles.subtitle}>Обратитесь к менеджеру</p>
          <button type="button" className={styles.refreshButton} onClick={reloadProfile}>
            Обновить
          </button>
        </section>

        <button
          type="button"
          aria-label="Закрыть меню"
          className={`${styles.overlay} ${isMenuOpen ? styles.overlayVisible : ''}`}
          onClick={() => setIsMenuOpen(false)}
        />

        <aside className={`${styles.drawer} ${isMenuOpen ? styles.drawerOpen : ''}`}>
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
            <button type="button" className={styles.menuItem}>
              <CalendarIcon />
              <span>График</span>
            </button>

            <button type="button" className={styles.menuItem}>
              <HistoryIcon />
              <span>История</span>
            </button>

            <a href="tel:+79000848683" className={styles.menuItem}>
              <PhoneIcon />
              <span>Позвонить менеджеру</span>
            </a>

            <Link href="/user/accountSettings" className={styles.menuItem}>
              <SettingsIcon />
              <span>Настройки</span>
            </Link>
          </nav>
        </aside>
      </div>
    </main>
  );
}
