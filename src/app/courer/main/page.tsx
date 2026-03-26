'use client';

import { useRouter } from 'next/navigation';
import { signOut } from '@/app/api/client/auth';
import { useCourerAccess } from '../useCourerAccess';
import styles from './page.module.scss';

export default function CourerMainPage() {
  const router = useRouter();
  const { profile, isChecking } = useCourerAccess();

  const handleLogout = async () => {
    await signOut();
    router.replace('/');
    router.refresh();
  };

  if (isChecking) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <p className={styles.status}>Проверяем доступ...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Курьер</p>
        <h1 className={styles.title}>{profile.name || profile.email}</h1>
        <p className={styles.description}>
          Маршрут `/courer/main` готов и защищен проверкой `isCourer`.
        </p>
        <button type="button" className={styles.button} onClick={handleLogout}>
          Выйти
        </button>
      </section>
    </main>
  );
}
