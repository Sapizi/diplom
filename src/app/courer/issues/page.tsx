'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import frameStyles from '../courierFrame.module.scss';
import styles from './page.module.scss';

const ISSUE_OPTIONS = [
  'Клиент не выходит на связь',
  'Изменение адреса',
  'Ошибка в заказе',
];

function CourerIssuesPageContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <main className={frameStyles.page}>
      <div className={frameStyles.viewport}>
        <section className={styles.sheet}>
          <div className={styles.handle} />
          <h1 className={styles.title}>Отметьте проблему</h1>
          {orderId ? <p className={styles.orderMeta}>Заказ {orderId.slice(0, 8)}</p> : null}

          <div className={styles.actions}>
            {ISSUE_OPTIONS.map((label) => (
              <a key={label} href="tel:+79000848683" className={styles.issueButton}>
                <span>{label}</span>
                <span className={styles.chevron}>›</span>
              </a>
            ))}
          </div>

          <Link href={orderId ? `/courer/orders/${orderId}` : '/courer/main'} className={styles.backLink}>
            Назад
          </Link>
        </section>
      </div>
    </main>
  );
}

export default function CourerIssuesPage() {
  return (
    <Suspense
      fallback={
        <main className={frameStyles.page}>
          <div className={frameStyles.viewport}>
            <div className={frameStyles.loadingState}>Загружаем страницу проблемы...</div>
          </div>
        </main>
      }
    >
      <CourerIssuesPageContent />
    </Suspense>
  );
}
