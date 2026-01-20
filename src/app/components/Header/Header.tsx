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
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  name: string;
  isAdmin: boolean;
}

export default function Header() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
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
          .select('name, "isAdmin"')
          .eq('id', session.user.id)
          .single();

        if (error || !profile) {
          setUser({
            id: session.user.id,
            name: session.user.email.split('@')[0] || 'Пользователь',
            isAdmin: false,
          });
        } else {
          setUser({
            id: session.user.id,
            name: profile.name || session.user.email.split('@')[0] || 'Пользователь',
            isAdmin: Boolean(profile.isAdmin),
          });
        }
      } catch (err) {
        console.error('Profile error:', err);
        setUser({
          id: session.user.id,
          name: session.user.email.split('@')[0] || 'Пользователь',
          isAdmin: false,
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Если юзер админ — ссылка на админку, иначе на его аккаунт */}
                  <Link 
                    href={user.isAdmin ? "/pages/admin/main" : "/pages/user/account"}
                    style={{
                      color: '#333',
                      textDecoration: 'none',
                      fontWeight: '500',
                      fontSize: '16px',
                    }}
                  >
                    {user.isAdmin ? "Админка" : user.name}
                  </Link>
                  
                </div>
                <Link href="/cart">
                  <img src="/cart.svg" alt="Cart" />
                </Link>
              </>
            ) : (
              <>
                <UserButtonLink href="/pages/login">Войти</UserButtonLink>
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
