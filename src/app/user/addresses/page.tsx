'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/app/components/Footer/Footer';
import Header from '@/app/components/Header/Header';
import { Wrapper } from '@/app/components/Header/HeaderStyles';
import { Title } from '@/app/MainPageStyles';
import AddressBook from '@/app/components/AddressBook/AddressBook';
import { getCurrentUser } from '@/app/api/client/auth';
import styles from './page.module.scss';

export default function UserAddressesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const user = await getCurrentUser();

      if (!isMounted) {
        return;
      }

      if (!user) {
        setIsLoading(false);
        router.push('/login');
        return;
      }

      setUserId(user.id);
      setIsLoading(false);
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <>
      <Header />
      <Wrapper>
        <div className={styles.page}>
          <div className={styles.hero}>
            <Title>Адреса доставки</Title>
            <p className={styles.description}>
              Сохраняйте адреса для быстрых заказов. Можно заполнить вручную или выбрать точку на карте.
            </p>
          </div>

          {!isLoading && userId ? (
            <AddressBook
              userId={userId}
              title="Мои адреса"
              description="Основной адрес будет подставляться первым при оформлении доставки."
            />
          ) : (
            <div className={styles.loading}>Загружаем профиль...</div>
          )}
        </div>
      </Wrapper>
      <Footer />
    </>
  );
}
