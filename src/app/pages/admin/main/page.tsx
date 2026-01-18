'use client';

import { useEffect, useState } from 'react';
import { redirect, useRouter } from 'next/navigation';

import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import { Wrapper } from "@/app/components/Header/HeaderStyles";
import { Title } from "@/app/MainPageStyles";
import { AdminBlock, AdminContainer } from "./AdminStyles";
import { GreyBlockText } from "../../user/account/AccountStyles";

import { supabase } from "../../../../../lib/supabase";

export default function AdminMain() {
  const redirect = () => {

  }
  const router = useRouter();

  const [usersCount, setUsersCount] = useState(0);
  const [menuCount, setMenuCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const fetchCounts = async () => {
    const { count: users } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: menu } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true });

    const { count: orders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    setUsersCount(users ?? 0);
    setMenuCount(menu ?? 0);
    setOrdersCount(orders ?? 0);
  };

  useEffect(() => {
    fetchCounts();

    const channel = supabase
      .channel('admin-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        fetchCounts
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        fetchCounts
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        fetchCounts
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

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
            <GreyBlockText onClick={redirect}>
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
