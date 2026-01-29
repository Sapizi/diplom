'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import { Wrapper } from "@/app/components/Header/HeaderStyles";
import { Title } from "@/app/MainPageStyles";
import { AdminBlock, AdminContainer } from "./AdminStyles";
import { GreyBlockText } from "../../user/account/AccountStyles";

import { getSession, onAuthStateChange, signOut } from "@/app/api/client/auth";
import { getIsAdmin } from "@/app/api/client/profiles";
import { fetchDashboardCounts } from "@/app/api/client/dashboard";
import { subscribeAdminDashboard } from "@/app/api/client/realtime";
import { LoginButton } from '../menu/AdminMenuStyles';

export default function AdminMain() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  const [usersCount, setUsersCount] = useState(0);
  const [menuCount, setMenuCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);

  // Проверка сессии и прав пользователя
  useEffect(() => {
    let isMounted = true;
    let unsubscribe: null | (() => void) = null;

    const checkAdmin = async (session: any) => {
      const { data: profile, error: profileError } = await getIsAdmin(session.user.id);

      if (!isMounted) return;

      if (profileError || !profile?.isAdmin) {
        setIsLoading(false);
        router.push('/');
        return;
      }

      setUserIsAdmin(true);
      setIsLoading(false);
    };

    const init = async () => {
      const { data: { session }, error } = await getSession();

      if (session) {
        await checkAdmin(session);
        return;
      }

      if (error) {
        setIsLoading(false);
        router.push('/login');
        return;
      }

      const { data: authListener } = onAuthStateChange(async (_event, nextSession) => {
        if (!isMounted) return;
        if (nextSession) {
          await checkAdmin(nextSession);
        } else {
          setIsLoading(false);
          router.push('/login');
        }
      });

      unsubscribe = () => authListener.subscription.unsubscribe();
    };

    init();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
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
        <Title style={{marginTop:'50px'}}>Главная</Title>

        <LoginButton
          onClick={handleLogout}
          style={{
            marginTop:'20px'
          }}
        >
          Выйти
        </LoginButton>

        <AdminContainer>
          <AdminBlock href={'/admin/users'}>
            <GreyBlockText>
              Пользователи: <b>{usersCount}</b>
            </GreyBlockText>
          </AdminBlock>

          <AdminBlock href={'/admin/menu'}>
            <GreyBlockText>
              Позиции меню: <b>{menuCount}</b>
            </GreyBlockText>
          </AdminBlock>

          <AdminBlock href={'/admin/orders'}>
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
