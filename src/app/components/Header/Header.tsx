'use client';

import {
  HeaderContainer,
  HeaderContent,
  Logo,
  LogoContainer,
  SocialLink,
  SocialLinks,
  UserButtonLink,
  UserButtons,
  Wrapper,
} from '@/app/components/Header/HeaderStyles';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Получаем текущую сессию при монтировании
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    getSession();

    // Подписываемся на изменения сессии (вход/выход)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
          });
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh(); // обновляем страницу или редиректим
  };

  if (loading) {
    // Можно показать загрузку или просто ничего (мигание)
    return (
      <HeaderContainer>
        <Wrapper>
          <HeaderContent>
            <SocialLinks>
              <SocialLink href="https://web.telegram.org/">Telegram</SocialLink>
              <SocialLink href="https://vk.com/">VK</SocialLink>
              <SocialLink href="#">+7-999-99-99</SocialLink>
            </SocialLinks>
            <LogoContainer>
              <Logo src="/logo.svg" alt="Logotype" />
            </LogoContainer>
            <UserButtons>
              <span>Загрузка...</span>
            </UserButtons>
          </HeaderContent>
        </Wrapper>
      </HeaderContainer>
    );
  }

  return (
    <HeaderContainer>
      <Wrapper>
        <HeaderContent>
          <SocialLinks>
            <SocialLink href="https://web.telegram.org/">
              <img src="/telegram_icon.svg" alt="Telegram contact" />
            </SocialLink>
            <SocialLink href="https://vk.com/">
              <img src="/vk_icon.svg" alt="VK contact" />
            </SocialLink>
            <SocialLink href="#">+7-999-99-99</SocialLink>
          </SocialLinks>

          <LogoContainer>
            <Logo src="/logo.svg" alt="Logotype" />
          </LogoContainer>

          <UserButtons>
            {user ? (
              <>
                {/* Отображаем имя из профиля, если есть */}
                <span style={{ color: '#333', fontWeight: '500' }}>
                  {user.email.split('@')[0]} {/* или вытащить имя из profiles — см. ниже */}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#007bff',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <UserButtonLink href="/pages/registration">Войти</UserButtonLink>
                <UserButtonLink href="#">
                  <img src="/cart.svg" alt="Cart" />
                </UserButtonLink>
              </>
            )}
          </UserButtons>
        </HeaderContent>
      </Wrapper>
    </HeaderContainer>
  );
}