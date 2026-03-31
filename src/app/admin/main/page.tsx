'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import PageLoader from '@/app/components/PageLoader/PageLoader';
import { fetchAdminOverview, type AdminOverviewStats } from '@/app/api/client/dashboard';
import { subscribeAdminDashboard } from '@/app/api/client/realtime';
import AdminShell from '@/app/admin/components/AdminShell/AdminShell';
import { useAdminAccess } from '@/app/admin/useAdminAccess';
import styles from './page.module.scss';

function formatRating(value: number | null) {
  if (value == null) {
    return 'Нет оценок';
  }

  return `${value.toFixed(1)} / 5`;
}

function formatCurrentDateLabel() {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

const EMPTY_STATS: AdminOverviewStats = {
  users: 0,
  employees: 0,
  managers: 0,
  couriers: 0,
  menu: 0,
  orders: 0,
  todayOrders: 0,
  todayAverageRating: null,
  todayReviewsCount: 0,
  onShiftEmployees: 0,
};

export default function AdminMainPage() {
  const { profile, isChecking } = useAdminAccess();
  const [stats, setStats] = useState<AdminOverviewStats>(EMPTY_STATS);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const todayLabel = useMemo(() => formatCurrentDateLabel(), []);

  useEffect(() => {
    if (!profile) {
      return;
    }

    let isMounted = true;

    const loadStats = async () => {
      const { data, error } = await fetchAdminOverview();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error('Admin overview load error:', error);
        setIsLoadingStats(false);
        return;
      }

      setStats(data ?? EMPTY_STATS);
      setIsLoadingStats(false);
    };

    loadStats();
    const unsubscribe = subscribeAdminDashboard(loadStats);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [profile]);

  const importantMetrics = useMemo(
    () => [
      {
        label: 'Средний рейтинг за сегодня',
        value: formatRating(stats.todayAverageRating),
        hint: stats.todayReviewsCount ? `${stats.todayReviewsCount} отзывов за ${todayLabel}` : 'Появится после первых отзывов',
      },
      {
        label: 'Заказов за сегодня',
        value: String(stats.todayOrders),
        hint: 'Все заказы, созданные сегодня',
      },
      {
        label: 'Сотрудников на смене',
        value: String(stats.onShiftEmployees),
        hint: 'Курьеры и менеджеры с открытой сменой',
      },
    ],
    [stats.onShiftEmployees, stats.todayAverageRating, stats.todayOrders, stats.todayReviewsCount, todayLabel]
  );

  const secondaryMetrics = useMemo(
    () => [
      {
        label: 'Всего пользователей',
        value: String(stats.users),
        hint: 'Все аккаунты в системе',
      },
      {
        label: 'Сотрудников',
        value: String(stats.employees),
        hint: `${stats.managers} менеджеров и ${stats.couriers} курьеров`,
      },
      {
        label: 'Позиции меню',
        value: String(stats.menu),
        hint: 'Активные и скрытые блюда',
      },
      {
        label: 'Все заказы',
        value: String(stats.orders),
        hint: 'История заказов за все время',
      },
    ],
    [stats.couriers, stats.employees, stats.managers, stats.menu, stats.orders, stats.users]
  );

  if (isChecking) {
    return <PageLoader label="Проверяем доступ администратора..." />;
  }

  if (!profile) {
    return null;
  }

  return (
    <AdminShell
      profile={profile}
      active="main"
      title="Главная"
      subtitle="Ключевые показатели за день и быстрые переходы к управлению пользователями, меню и заказами."
    >
      <section className={styles.metrics}>
        {importantMetrics.map((metric) => (
          <article key={metric.label} className={`${styles.metricCard} ${styles.metricCardImportant}`}>
            <p className={styles.metricLabel}>{metric.label}</p>
            <p className={styles.metricValue}>{metric.value}</p>
            <p className={styles.metricHint}>{metric.hint}</p>
          </article>
        ))}
      </section>

      <section className={styles.metricsSecondary}>
        {secondaryMetrics.map((metric) => (
          <article key={metric.label} className={styles.metricCard}>
            <p className={styles.metricLabel}>{metric.label}</p>
            <p className={styles.metricValue}>{metric.value}</p>
            <p className={styles.metricHint}>{metric.hint}</p>
          </article>
        ))}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelEyebrow}>Быстрые действия</p>
            <h2 className={styles.panelTitle}>Основные разделы админки</h2>
          </div>

          {isLoadingStats ? <span className={styles.panelMeta}>Обновляем статистику...</span> : null}
        </div>

        <div className={styles.linkGrid}>
          <Link href="/admin/users" className={styles.linkCard}>
            <span className={styles.linkLabel}>Пользователи</span>
            <strong className={styles.linkValue}>{stats.users}</strong>
            <span className={styles.linkHint}>Создание аккаунтов, роли сотрудников, редактирование и история заказов</span>
          </Link>

          <Link href="/admin/menu" className={styles.linkCard}>
            <span className={styles.linkLabel}>Меню</span>
            <strong className={styles.linkValue}>{stats.menu}</strong>
            <span className={styles.linkHint}>Позиции, категории, доступность и калории</span>
          </Link>

          <Link href="/admin/orders" className={styles.linkCard}>
            <span className={styles.linkLabel}>Заказы</span>
            <strong className={styles.linkValue}>{stats.orders}</strong>
            <span className={styles.linkHint}>Контроль статусов и полный список заказов</span>
          </Link>
        </div>
      </section>
    </AdminShell>
  );
}
