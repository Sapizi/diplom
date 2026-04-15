'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  fetchManagerEmployeeProfile,
  fetchManagerEmployees,
  setManagerEmployeeOpen,
  type ManagerEmployee,
  type ManagerEmployeeProfile,
} from '@/app/api/client/manager';
import { signOut, redirectToHome } from '@/app/api/client/auth';
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

function getEmployeeSearchText(employee: ManagerEmployee) {
  return [employee.name, employee.email, employee.phone, employee.id]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function formatWorkedTime(minutes: number) {
  if (!minutes) {
    return '0 ч';
  }

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  if (!restMinutes) {
    return `${hours} ч`;
  }

  return `${hours} ч ${restMinutes} мин`;
}

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Нет данных';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function renderStars(rating: number | null) {
  if (rating == null) {
    return 'Нет оценок';
  }

  const rounded = Math.round(rating);
  return `${Array.from({ length: 5 }, (_, index) => (index < rounded ? '★' : '☆')).join('')} ${rating.toFixed(1)}`;
}

export default function ManagerStaffPage() {
  const { profile, isChecking } = useManagerAccess();
  const [employees, setEmployees] = useState<ManagerEmployee[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);
  const [activeEmployeeProfile, setActiveEmployeeProfile] = useState<ManagerEmployeeProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
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

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();

    if (!normalizedQuery) {
      return employees;
    }

    return employees.filter((employee) => getEmployeeSearchText(employee).includes(normalizedQuery));
  }, [employees, searchValue]);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await signOut();
      redirectToHome();
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
    setActiveEmployeeProfile((prev) =>
      prev && prev.employee.id === employee.id
        ? {
            ...prev,
            employee: {
              ...prev.employee,
              isOpen: nextValue,
            },
          }
        : prev
    );
    setTogglingId(null);
  };

  const handleOpenProfile = async (employeeId: string) => {
    if (activeEmployeeId === employeeId && activeEmployeeProfile) {
      return;
    }

    setActiveEmployeeId(employeeId);
    setIsProfileLoading(true);

    const { data, error } = await fetchManagerEmployeeProfile(employeeId);

    if (error) {
      console.error('Manager employee profile load error:', error);
      alert(error.message ?? 'Не удалось загрузить профиль курьера');
      setIsProfileLoading(false);
      return;
    }

    setActiveEmployeeProfile(data);
    setIsProfileLoading(false);
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
              Здесь видно, кто сейчас в смене, можно найти любого курьера и открыть его профиль.
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

          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Найдено</span>
            <strong className={styles.summaryValue}>{filteredEmployees.length}</strong>
          </article>
        </section>

        <section className={styles.searchCard}>
          <label className={styles.searchField}>
            <span>Поиск курьера</span>
            <input
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Имя, почта, телефон или id"
            />
          </label>
        </section>

        {activeEmployeeId ? (
          <section className={styles.profilePanel}>
            {isProfileLoading || !activeEmployeeProfile ? (
              <div className={styles.profileLoading}>Загружаем профиль курьера...</div>
            ) : (
              <>
                <div className={styles.profileTop}>
                  <div className={styles.profileHero}>
                    {activeEmployeeProfile.employee.avatar_url ? (
                      <img
                        src={activeEmployeeProfile.employee.avatar_url}
                        alt={activeEmployeeProfile.employee.name ?? 'Курьер'}
                        className={styles.profileAvatar}
                      />
                    ) : (
                      <div className={styles.profileAvatarFallback}>
                        {(activeEmployeeProfile.employee.name || activeEmployeeProfile.employee.email || 'К')
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>
                    )}

                    <div>
                      <h2 className={styles.profileTitle}>
                        {activeEmployeeProfile.employee.name || 'Без имени'}
                      </h2>
                      <p className={styles.profileSubtitle}>{activeEmployeeProfile.employee.email || 'Без почты'}</p>
                      <div className={styles.profileTags}>
                        <span className={`${styles.statusBadge} ${activeEmployeeProfile.employee.isOpen ? styles.statusOpen : styles.statusClosed}`}>
                          {activeEmployeeProfile.employee.isOpen ? 'Смена открыта' : 'Смена закрыта'}
                        </span>
                        <span className={styles.infoTag}>Телефон: {activeEmployeeProfile.employee.phone || 'не указан'}</span>
                        <span className={styles.infoTag}>В системе: {formatDateTime(activeEmployeeProfile.employee.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.closeProfileButton}
                    onClick={() => {
                      setActiveEmployeeId(null);
                      setActiveEmployeeProfile(null);
                    }}
                  >
                    Скрыть профиль
                  </button>
                </div>

                <div className={styles.profileStats}>
                  <article className={styles.profileStatCard}>
                    <span className={styles.profileStatLabel}>Всего доставил</span>
                    <strong className={styles.profileStatValue}>{activeEmployeeProfile.stats.deliveredTotal}</strong>
                  </article>
                  <article className={styles.profileStatCard}>
                    <span className={styles.profileStatLabel}>За месяц доставок</span>
                    <strong className={styles.profileStatValue}>{activeEmployeeProfile.stats.deliveredThisMonth}</strong>
                  </article>
                  <article className={styles.profileStatCard}>
                    <span className={styles.profileStatLabel}>Отработал за месяц</span>
                    <strong className={styles.profileStatValue}>{formatWorkedTime(activeEmployeeProfile.stats.workedMinutesThisMonth)}</strong>
                  </article>
                  <article className={styles.profileStatCard}>
                    <span className={styles.profileStatLabel}>Личный рейтинг</span>
                    <strong className={styles.profileStatValue}>{renderStars(activeEmployeeProfile.stats.averageRating)}</strong>
                    <span className={styles.profileStatHint}>
                      {activeEmployeeProfile.stats.ratingsCount
                        ? `${activeEmployeeProfile.stats.ratingsCount} оценок по доставленным заказам`
                        : 'Пока без отзывов'}
                    </span>
                  </article>
                </div>

                <div className={styles.ordersPanel}>
                  <div className={styles.ordersPanelHeader}>
                    <div>
                      <p className={styles.ordersEyebrow}>Последние доставки</p>
                      <h3 className={styles.ordersTitle}>Какие заказы отвёз курьер</h3>
                    </div>
                    <Link
                      href={`/manager/schedule?employeeId=${activeEmployeeProfile.employee.id}`}
                      className={styles.secondaryButton}
                    >
                      В график
                    </Link>
                  </div>

                  {activeEmployeeProfile.recentOrders.length === 0 ? (
                    <div className={styles.profileLoading}>У курьера пока нет завершённых доставок.</div>
                  ) : (
                    <div className={styles.profileOrdersList}>
                      {activeEmployeeProfile.recentOrders.map((order) => (
                        <article key={order.id} className={styles.profileOrderCard}>
                          <div className={styles.profileOrderTop}>
                            <div>
                              <p className={styles.profileOrderId}>Заказ #{order.id.slice(0, 8)}</p>
                              <p className={styles.profileOrderMeta}>{formatDateTime(order.delivered_at || order.created_at)}</p>
                            </div>
                            <strong className={styles.profileOrderAmount}>{formatCurrency(order.total_amount)}</strong>
                          </div>

                          <p className={styles.profileOrderAddress}>
                            {[order.street, order.house].filter(Boolean).join(', ') || 'Адрес не указан'}
                          </p>
                          <p className={styles.profileOrderMeta}>
                            Клиент: {order.customer_name || 'не указан'}{order.customer_phone ? ` • ${order.customer_phone}` : ''}
                          </p>

                          <div className={styles.profileOrderReview}>
                            <span className={styles.profileOrderRating}>{renderStars(order.rating)}</span>
                            <p>{order.review_comment || 'Комментария к заказу нет.'}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        ) : null}

        {isLoading ? (
          <div className={styles.emptyState}>Загружаем сотрудников...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className={styles.emptyState}>
            {employees.length === 0 ? 'Курьеров пока нет.' : 'По вашему запросу никого не найдено.'}
          </div>
        ) : (
          <section className={styles.grid}>
            {filteredEmployees.map((employee) => (
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
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => handleOpenProfile(employee.id)}
                    >
                      Профиль
                    </button>
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
