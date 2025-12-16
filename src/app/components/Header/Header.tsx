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
import Link from 'next/link';


interface UserProfile {
  id: string;
  name: string;
}

interface UserSession {
  user: {
    id: string;
    email: string;
  };
}

export default function Header() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Сначала получаем текущую сессию
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          await loadUserProfile(session);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    const loadUserProfile = async (session: any) => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Profile fetch error:', error);
          setUser({
            id: session.user.id,
            name: session.user.email.split('@')[0] || 'Пользователь'
          });
        } else {
          setUser({
            id: session.user.id,
            name: profile.name || session.user.email.split('@')[0] || 'Пользователь'
          });
        }
      } catch (err) {
        console.error('Profile error:', err);
        setUser({
          id: session.user.id,
          name: session.user.email.split('@')[0] || 'Пользователь'
        });
      }
    };


    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          await loadUserProfile(session);
        } else {
          setUser(null);
        }
      }
    );

    
    initializeAuth();


    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

 
  if (isLoading) {
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
              <span>Загрузка...</span>
              <Link href="/cart">
                <img src="/cart.svg" alt="Cart" />
              </Link>
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
            <SocialLink href="https://web.telegram.org/" target="_blank" rel="noopener noreferrer">
              <img src="/telegram_icon.svg" alt="Telegram contact" />
            </SocialLink>
            <SocialLink href="https://vk.com/" target="_blank" rel="noopener noreferrer">
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
                <Link 
                  href="/pages/user/account"
                  className="user-name"
                  style={{
                    color: '#333',
                    textDecoration: 'none',
                    fontWeight: '500',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  {user.name}
                </Link>
                <Link href="/cart">
                  <img src="/cart.svg" alt="Cart" />
                </Link>
              </>
            ) : (
              <>
                <UserButtonLink href="/login">Войти</UserButtonLink>
                <UserButtonLink href="/cart">
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