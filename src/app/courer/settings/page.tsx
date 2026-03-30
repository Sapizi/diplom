'use client';

import { useEffect, useState } from 'react';
import { fetchProfileSettings } from '@/app/api/client/profiles';
import CourierMenu, { CourierMenuButton } from '../CourierMenu';
import frameStyles from '../courierFrame.module.scss';
import { useCourerAccess } from '../useCourerAccess';
import styles from './page.module.scss';

type ToggleKey = 'darkTheme' | 'notifications' | 'sound';

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.toggle} ${checked ? styles.toggleActive : ''}`}
      onClick={onChange}
      aria-pressed={checked}
    >
      <span />
    </button>
  );
}

export default function CourerSettingsPage() {
  const { profile, isChecking } = useCourerAccess();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [phone, setPhone] = useState('Не указан');
  const [settings, setSettings] = useState({
    darkTheme: false,
    notifications: true,
    sound: true,
    language: 'Русский',
  });

  useEffect(() => {
    if (!profile?.id) {
      return;
    }

    const loadProfileSettings = async () => {
      const { data } = await fetchProfileSettings(profile.id);
      setPhone(data?.phone || 'Не указан');
    };

    loadProfileSettings();
  }, [profile?.id]);

  useEffect(() => {
    const saved = window.localStorage.getItem('courier-settings');
    if (!saved) {
      return;
    }

    try {
      setSettings((current) => ({ ...current, ...JSON.parse(saved) }));
    } catch (error) {
      console.error('Courier settings parse error:', error);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('courier-settings', JSON.stringify(settings));
  }, [settings]);

  const toggleSetting = (key: ToggleKey) => {
    setSettings((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  if (isChecking) {
    return (
      <main className={frameStyles.page}>
        <div className={frameStyles.viewport}>
          <div className={frameStyles.loadingState}>Открываем настройки...</div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <main className={frameStyles.page}>
      <div className={frameStyles.viewport}>
        <CourierMenuButton onClick={() => setIsMenuOpen(true)} />

        <section className={`${frameStyles.scrollable} ${styles.content}`}>
          <header className={styles.header}>
            <h1 className={styles.title}>Настройки</h1>
          </header>

          <div className={styles.settingsList}>
            <div className={styles.row}>
              <span className={styles.label}>Почта</span>
              <span className={styles.value}>{profile.email}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Телефон</span>
              <span className={styles.value}>{phone}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Темная тема</span>
              <Toggle checked={settings.darkTheme} onChange={() => toggleSetting('darkTheme')} />
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Уведомления</span>
              <Toggle checked={settings.notifications} onChange={() => toggleSetting('notifications')} />
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Звук</span>
              <Toggle checked={settings.sound} onChange={() => toggleSetting('sound')} />
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Язык</span>
              <button
                type="button"
                className={styles.languageButton}
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    language: current.language === 'Русский' ? 'English' : 'Русский',
                  }))
                }
              >
                {settings.language}
              </button>
            </div>
          </div>
        </section>

        <CourierMenu profile={profile} isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} active="settings" />
      </div>
    </main>
  );
}
