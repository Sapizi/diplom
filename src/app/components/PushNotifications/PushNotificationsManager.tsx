'use client';

import { useEffect, useState } from 'react';
import { fetchAuthenticatedRoleProfile } from '@/app/api/client/profiles';
import { getSession } from '@/app/api/client/auth';
import styles from './PushNotificationsManager.module.scss';

type PermissionState = 'unsupported' | 'idle' | 'prompt' | 'granted' | 'denied';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function subscribeBrowser(publicKey: string) {
  const registration = await navigator.serviceWorker.register('/push-sw.js');
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    return existingSubscription;
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
}

export default function PushNotificationsManager() {
  const [permission, setPermission] = useState<PermissionState>('idle');
  const [isCustomer, setIsCustomer] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (
        typeof window === 'undefined' ||
        !('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        !('Notification' in window)
      ) {
        if (isMounted) {
          setPermission('unsupported');
        }
        return;
      }

      const envPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
      if (!envPublicKey) {
        if (isMounted) {
          setPermission('unsupported');
        }
        return;
      }

      const {
        data: { session },
      } = await getSession();

      if (!isMounted || !session) {
        return;
      }

      const { data, error } = await fetchAuthenticatedRoleProfile(session.access_token);

      if (!isMounted || error || !data) {
        return;
      }

      const isStaff =
        Boolean(data.profile?.isAdmin) ||
        Boolean(data.profile?.isCourer) ||
        Boolean(data.profile?.isManager);

      if (isStaff) {
        return;
      }

      setPublicKey(envPublicKey);
      setIsCustomer(true);

      if (Notification.permission === 'granted') {
        setPermission('granted');

        try {
          const subscription = await subscribeBrowser(envPublicKey);
          await fetch('/api/notifications/push-subscriptions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(subscription.toJSON()),
          });
        } catch (error) {
          console.error('Push sync error:', error);
        }

        return;
      }

      if (Notification.permission === 'denied') {
        setPermission('denied');
        return;
      }

      setPermission('prompt');
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const enablePush = async () => {
    if (!publicKey) {
      return;
    }

    setIsBusy(true);

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult === 'default' ? 'prompt' : permissionResult);

      if (permissionResult !== 'granted') {
        setIsBusy(false);
        return;
      }

      const {
        data: { session },
      } = await getSession();

      if (!session) {
        setIsBusy(false);
        return;
      }

      const subscription = await subscribeBrowser(publicKey);
      const res = await fetch('/api/notifications/push-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Failed to save push subscription');
      }
    } catch (error) {
      console.error('Push enable error:', error);
    } finally {
      setIsBusy(false);
    }
  };

  if (!isCustomer || isDismissed) {
    return null;
  }

  if (permission !== 'prompt') {
    return null;
  }

  return (
    <div className={styles.prompt}>
      <p className={styles.title}>Уведомим, когда заказ будет готов</p>
      <p className={styles.text}>Включите push, чтобы не держать вкладку открытой.</p>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={enablePush} disabled={isBusy}>
          {isBusy ? 'Подключаем...' : 'Включить push'}
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => setIsDismissed(true)}
          disabled={isBusy}
        >
          Не сейчас
        </button>
      </div>
    </div>
  );
}
