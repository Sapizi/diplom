'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/app/api/client/auth';
import { fetchManagerEmployees, setManagerEmployeeOpen, type ManagerEmployee } from '@/app/api/client/manager';
import { subscribeManagerWorkspace } from '@/app/api/client/realtime';
import { useManagerAccess } from '../useManagerAccess';
import styles from './page.module.scss';

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

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3V6M17 3V6M4 9H20M6.5 5H17.5C18.8807 5 20 6.11929 20 7.5V18C20 19.3807 18.8807 20.5 17.5 20.5H6.5C5.11929 20.5 4 19.3807 4 18V7.5C4 6.11929 5.11929 5 6.5 5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function StaffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12Z"
        fill="currentColor"
      />
      <path d="M4 20C4.8 16.9 7.65 14.75 12 14.75C16.35 14.75 19.2 16.9 20 20" fill="currentColor" />
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

export default function ManagerStaffPage() {
  const router = useRouter();
  const { profile, isChecking } = useManagerAccess();
  const [employees, setEmployees] = useState<ManagerEmployee[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    let isMounted = true;

    const loadEmployees = async () => {
      const { data, error } = await fetchManagerEmployees();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error('Manager employees load error:', error);
        setIsLoading(false);
        return;
      }

      setEmployees(data ?? []);
      setIsLoading(false);
    };

    loadEmployees();

    const unsubscribe = subscribeManagerWorkspace(loadEmployees, `manager-staff-${profile.id}`);
    const fallbackRefresh = window.setInterval(loadEmployees, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(fallbackRefresh);
      unsubscribe();
    };
  }, [profile]);

  const displayName = useMemo(() => {
    const profileName = profile?.name?.trim();
    if (profileName) {
      return profileName;
    }

    return profile?.email.split('@')[0] || 'Менеджер';
  }, [profile]);

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
      console.error('Manager logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const handleToggleShift = async (employee: ManagerEmployee) => {
    setTogglingId(employee.id);

    const nextValue = !employee.isOpen;
    const { error } = await setManagerEmployeeOpen(employee.id, nextValue);

    if (error) {
      console.error('Manager employee toggle error:', error);
      alert(error.message ?? 'Не удалось изменить состояние смены');
      setTogglingId(null);
      return;
    }

    setEmployees((prev) =>
      prev.map((item) => (item.id === employee.id ? { ...item, isOpen: nextValue } : item))
    );
    setTogglingId(null);
  };

  if (isChecking) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingState}>Проверяем доступ менеджера...</div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

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
          <Link href="/manager/main" className={styles.logoLink}>
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
              <p className={styles.profileRole}>Менеджер смены</p>
            </div>
          </div>

          <nav className={styles.nav}>
            <Link href="/manager/main" className={styles.navItem}>
              <HomeIcon />
              <span>Главная</span>
            </Link>
            <Link href="/manager/schedule" className={styles.navItem}>
              <CalendarIcon />
              <span>График</span>
            </Link>
            <Link href="/manager/staff" className={`${styles.navItem} ${styles.navItemActive}`}>
              <StaffIcon />
              <span>Сотрудники</span>
            </Link>
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

          <div>
            <p className={styles.eyebrow}>Команда доставки</p>
            <h1 className={styles.title}>Все курьеры</h1>
            <p className={styles.subtitle}>
              Здесь видно, кто сейчас в смене и кого отправлять в график.
            </p>
          </div>
        </header>

        <section className={styles.summaryRow}>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Всего курьеров</span>
            <strong className={styles.summaryValue}>{employees.length}</strong>
          </article>

          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Смена открыта</span>
            <strong className={styles.summaryValue}>
              {employees.filter((employee) => employee.isOpen).length}
            </strong>
          </article>
        </section>

        {isLoading ? (
          <div className={styles.emptyState}>Загружаем сотрудников...</div>
        ) : employees.length === 0 ? (
          <div className={styles.emptyState}>Курьеров пока нет.</div>
        ) : (
          <section className={styles.grid}>
            {employees.map((employee) => (
              <article key={employee.id} className={styles.employeeCard}>
                <div className={styles.employeeHeader}>
                  {employee.avatar_url ? (
                    <img src={employee.avatar_url} alt={employee.name ?? 'Курьер'} className={styles.employeeAvatar} />
                  ) : (
                    <div className={styles.employeeAvatarFallback}>
                      {(employee.name || employee.email || 'К').slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className={styles.employeeMeta}>
                    <h2 className={styles.employeeName}>{employee.name || 'Без имени'}</h2>
                    <p className={styles.employeeInfo}>{employee.email || 'Без почты'}</p>
                    <p className={styles.employeeInfo}>{employee.phone || 'Телефон не указан'}</p>
                  </div>
                </div>

                <div className={styles.employeeFooter}>
                  <span className={`${styles.statusBadge} ${employee.isOpen ? styles.statusOpen : styles.statusClosed}`}>
                    {employee.isOpen ? 'Смена открыта' : 'Смена закрыта'}
                  </span>

                  <div className={styles.employeeActions}>
                    <Link href={`/manager/schedule?employeeId=${employee.id}`} className={styles.secondaryButton}>
                      В график
                    </Link>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() => handleToggleShift(employee)}
                      disabled={togglingId === employee.id}
                    >
                      {togglingId === employee.id
                        ? 'Сохраняем...'
                        : employee.isOpen
                          ? 'Закрыть смену'
                          : 'Открыть смену'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}
