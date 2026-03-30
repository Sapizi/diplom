'use client';

import Link from 'next/link';
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
import styles from './Header.module.scss';

export default function Header() {
  const { user, isLoading } = useHeaderAuth();

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
              <UserButtonLink href="/login">Войти</UserButtonLink>
            </UserButtons>
          </HeaderContent>
        </Wrapper>
      </HeaderContainer>
    );
  }

  const accountHref = user?.isCourer
    ? '/courer/main'
    : user?.isManager
      ? '/manager/main'
      : user?.isAdmin
        ? '/admin/main'
        : '/user/account';

  const accountLabel = user?.isCourer
    ? user.name
    : user?.isManager
      ? 'Менеджерская'
      : user?.isAdmin
        ? 'Админка'
        : user?.name;

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
                <div className={styles.userMeta}>
                  <Link href={accountHref} className={styles.accountLink}>
                    {accountLabel}
                  </Link>
                </div>
                <Link href="/user/cart">
                  <img src="/cart.svg" alt="Cart" />
                </Link>
              </>
            ) : (
              <UserButtonLink href="/login">Войти</UserButtonLink>
            )}
          </UserButtons>
        </HeaderContent>
      </Wrapper>
    </HeaderContainer>
  );
}
