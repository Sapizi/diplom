'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import { Wrapper } from "@/app/components/Header/HeaderStyles";
import { Title } from "@/app/MainPageStyles";
import { AdminBlock, AdminContainer } from "./AdminStyles";
import { GreyBlockText } from "../../user/account/AccountStyles";

import { getSession, signOut } from "@/app/api/client/auth";
import { getIsAdmin } from "@/app/api/client/profiles";
import { fetchDashboardCounts } from "@/app/api/client/dashboard";
import { subscribeAdminDashboard } from "@/app/api/client/realtime";

export default function AdminMain() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  const [usersCount, setUsersCount] = useState(0);
  const [menuCount, setMenuCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);

  // Проверка сессии и прав пользователя
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session }, error } = await getSession();

      if (error || !session) {
        router.push('/pages/login'); // если нет сессии — на логин
        return;
      }

      // Получаем профиль пользователя
      const { data: profile, error: profileError } = await getIsAdmin(session.user.id);

      if (profileError || !profile?.isAdmin) {
        router.push('/'); // если не админ — на главную
        return;
      }

      setUserIsAdmin(true);
      setIsLoading(false);
    };

    checkAdmin();
  }, [router]);

  // Функция для получения количества записей
  const fetchCounts = async () => {
    const counts = await fetchDashboardCounts();
    setUsersCount(counts.users);
    setMenuCount(counts.menu);
    setOrdersCount(counts.orders);
  };

  useEffect(() => {
    if (!userIsAdmin) return; // если не админ, не делаем запросы

    fetchCounts();

    const unsubscribe = subscribeAdminDashboard(fetchCounts);

    return () => {
      unsubscribe();
    };
  }, [userIsAdmin]);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  if (isLoading) return <div>Загрузка...</div>;

  return (
    <>
      <Header />

      <Wrapper>
        <Title>Главная</Title>

        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '4px 8px',
          }}
        >
          Выйти
        </button>

        <AdminContainer>
          <AdminBlock href={'/pages/admin/users'}>
            <GreyBlockText>
              Пользователи: <b>{usersCount}</b>
            </GreyBlockText>
          </AdminBlock>

          <AdminBlock href={'/pages/admin/menu'}>
            <GreyBlockText>
              Позиции меню: <b>{menuCount}</b>
            </GreyBlockText>
          </AdminBlock>

          <AdminBlock href={'/pages/admin/orders'}>
            <GreyBlockText>
              Заказы: <b>{ordersCount}</b>
            </GreyBlockText>
          </AdminBlock>
        </AdminContainer>
      </Wrapper>

      <Footer />
    </>
  );
}
