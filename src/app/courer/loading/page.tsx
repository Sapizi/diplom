'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCourerAccess } from '../useCourerAccess';
import styles from './page.module.scss';

const MIN_VISIBLE_MS = 350;
const ANIMATION_DELAY_MS = 1200;

export default function CourerLoadingPage() {
  const router = useRouter();
  const { profile, isChecking } = useCourerAccess();
  const mountedAtRef = useRef(Date.now());
  const [showAnimation, setShowAnimation] = useState(false);

  const displayName = useMemo(() => {
    const profileName = profile?.name?.trim();

    if (profileName) {
      return profileName;
    }

    const emailName = profile?.email.split('@')[0]?.trim();
    return emailName || 'курьер';
  }, [profile]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setShowAnimation(true);
    }, ANIMATION_DELAY_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, []);

  useEffect(() => {
    if (isChecking || !profile) {
      return;
    }

    const elapsed = Date.now() - mountedAtRef.current;
    const delay = Math.max(MIN_VISIBLE_MS - elapsed, 0);

    const timerId = window.setTimeout(() => {
      router.replace('/courer/main');
    }, delay);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isChecking, profile, router]);

  return (
    <main className={styles.page}>
      <div className={styles.viewport}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            <span>Хорошей смены,</span>
            <span>{displayName}</span>
          </h1>

          <div className={styles.brand}>
            <Image
              src="/paper.svg"
              alt="Перец"
              width={72}
              height={71}
              priority
              className={showAnimation ? styles.pepperAnimated : styles.pepper}
            />
            <Image
              src="/logo.svg"
              alt="Чипотл"
              width={140}
              height={49}
              priority
              className={styles.logo}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
