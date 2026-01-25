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
import { useHeaderAuth } from './useHeaderAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const { user, isLoading, logout } = useHeaderAuth();

  const handleLogout = async () => {
    try {
      await logout();
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
              <SocialLink href="#">+7-900-084-86-83</SocialLink>
            </SocialLinks>
            <LogoContainer>
              <Logo src="/logo.svg" alt="Logotype" />
            </LogoContainer>
            <UserButtons>
              <UserButtonLink href="/pages/login">Войти</UserButtonLink>
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
            <SocialLink href="#">+7-900-084-86-83</SocialLink>
          </SocialLinks>

          <LogoContainer>
            <Logo src="/logo.svg" alt="Logotype" />
          </LogoContainer>

          <UserButtons>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                <Link href="/pages/user/cart">
                  <img src="/cart.svg" alt="Cart" />
                </Link>
              </>
            ) : (
              <>
                <UserButtonLink href="/pages/login">Войти</UserButtonLink>
              </>
            )}
          </UserButtons>
        </HeaderContent>
      </Wrapper>
    </HeaderContainer>
  );
}
